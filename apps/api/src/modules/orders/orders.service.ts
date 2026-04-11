import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { OrderStatus as PrismaOrderStatus } from '@prisma/client';

import { OrderStatus } from '@repo/types';
import type {
  ChangeOrderStatusInput,
  CreateOrderInput,
  UpdateOrderInput,
} from '@repo/validators';

import { AccountingService } from '../../common/accounting/accounting.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';

export interface OrderListItem {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  unit: string;
  status: OrderStatus;
  deliveryDate: Date;
  totalValue: number;
  advancePaid: number;
  customer: { id: string; name: string };
  createdAt: Date;
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.ENQUIRY]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.IN_PRODUCTION, OrderStatus.CANCELLED],
  [OrderStatus.IN_PRODUCTION]: [OrderStatus.QUALITY_CHECK, OrderStatus.CANCELLED],
  [OrderStatus.QUALITY_CHECK]: [OrderStatus.READY, OrderStatus.IN_PRODUCTION],
  [OrderStatus.READY]: [OrderStatus.DISPATCHED],
  [OrderStatus.DISPATCHED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
    private readonly notifications: NotificationsService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async list(
    orgId: string,
    options: { page: number; pageSize: number; status?: OrderStatus; search?: string },
  ): Promise<{ data: OrderListItem[]; total: number }> {
    const where = {
      orgId,
      ...(options.status ? { status: options.status as PrismaOrderStatus } : {}),
      ...(options.search
        ? {
            OR: [
              { orderNumber: { contains: options.search, mode: 'insensitive' as const } },
              { productName: { contains: options.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.order.findMany({
        where,
        include: { customer: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.client.order.count({ where }),
    ]);

    return {
      data: rows.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        productName: o.productName,
        quantity: o.quantity,
        unit: o.unit,
        status: o.status as OrderStatus,
        deliveryDate: o.deliveryDate,
        totalValue: Number(o.totalValue),
        advancePaid: Number(o.advancePaid),
        customer: o.customer,
        createdAt: o.createdAt,
      })),
      total,
    };
  }

  async get(orgId: string, id: string): Promise<
    OrderListItem & {
      notes: string | null;
      jobCards: Array<{
        id: string;
        status: string;
        department: { id: string; name: string; sequence: number };
        assignedTo: string | null;
      }>;
    }
  > {
    const o = await this.prisma.client.order.findFirst({
      where: { id, orgId },
      include: {
        customer: { select: { id: true, name: true } },
        jobCards: {
          include: { department: { select: { id: true, name: true, sequence: true } } },
          orderBy: { department: { sequence: 'asc' } },
        },
      },
    });
    if (!o) throw new NotFoundException('Order not found');
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      productName: o.productName,
      quantity: o.quantity,
      unit: o.unit,
      status: o.status as OrderStatus,
      deliveryDate: o.deliveryDate,
      totalValue: Number(o.totalValue),
      advancePaid: Number(o.advancePaid),
      customer: o.customer,
      createdAt: o.createdAt,
      notes: o.notes,
      jobCards: o.jobCards.map((jc) => ({
        id: jc.id,
        status: jc.status,
        department: jc.department,
        assignedTo: jc.assignedTo,
      })),
    };
  }

  async create(orgId: string, userId: string, input: CreateOrderInput): Promise<{ id: string }> {
    // Ensure customer exists within this org
    const customer = await this.prisma.client.customer.findFirst({
      where: { id: input.customerId, orgId },
    });
    if (!customer) throw new BadRequestException('Customer not found in this organisation');

    const order = await this.prisma.client.order.create({
      data: {
        orgId,
        customerId: input.customerId,
        orderNumber: input.orderNumber,
        productName: input.productName,
        quantity: input.quantity,
        unit: input.unit,
        deliveryDate: input.deliveryDate,
        totalValue: BigInt(input.totalValue),
        advancePaid: BigInt(input.advancePaid ?? 0),
        notes: input.notes ?? null,
        createdBy: userId,
        status: 'ENQUIRY',
      },
    });

    this.gateway.emitToOrg(orgId, 'order:created', { id: order.id });
    return { id: order.id };
  }

  async update(
    orgId: string,
    id: string,
    input: UpdateOrderInput,
  ): Promise<{ id: string }> {
    const existing = await this.prisma.client.order.findFirst({ where: { id, orgId } });
    if (!existing) throw new NotFoundException('Order not found');

    await this.prisma.client.order.update({
      where: { id },
      data: {
        ...(input.productName !== undefined ? { productName: input.productName } : {}),
        ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
        ...(input.unit !== undefined ? { unit: input.unit } : {}),
        ...(input.deliveryDate !== undefined ? { deliveryDate: input.deliveryDate } : {}),
        ...(input.totalValue !== undefined
          ? { totalValue: BigInt(input.totalValue) }
          : {}),
        ...(input.advancePaid !== undefined
          ? { advancePaid: BigInt(input.advancePaid) }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });
    return { id };
  }

  /**
   * Transition an order's status. When DISPATCHED is reached, trigger
   * the auto-accounting engine and emit a real-time event.
   */
  async changeStatus(
    orgId: string,
    userId: string,
    id: string,
    input: ChangeOrderStatusInput,
  ): Promise<{ id: string; status: OrderStatus }> {
    const existing = await this.prisma.client.order.findFirst({ where: { id, orgId } });
    if (!existing) throw new NotFoundException('Order not found');

    const current = existing.status as OrderStatus;
    const allowed = ALLOWED_TRANSITIONS[current] ?? [];
    if (!allowed.includes(input.status)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${input.status}`,
      );
    }

    const updated = await this.prisma.client.order.update({
      where: { id },
      data: { status: input.status },
    });

    if (input.status === OrderStatus.DISPATCHED) {
      // Assume 18% GST default — in reality this would come from the order line items.
      const gstPaise = (existing.totalValue * 18n) / 118n;
      await this.accounting.onOrderDispatched({
        orgId,
        orderId: id,
        orderNumber: existing.orderNumber,
        totalPaise: existing.totalValue,
        gstPaise,
        date: new Date(),
      });
    }

    // Real-time + notification
    this.gateway.emitToOrg(orgId, 'order:status_changed', {
      id,
      status: input.status,
      by: userId,
    });
    await this.notifications.notifyOrg({
      orgId,
      type: 'ORDER_STATUS_CHANGED',
      title: `Order ${existing.orderNumber} → ${input.status}`,
      body: input.note ?? 'Order status updated',
      metadata: { orderId: id, newStatus: input.status },
    });

    return { id: updated.id, status: updated.status as OrderStatus };
  }

  async recordPayment(
    orgId: string,
    id: string,
    amountPaise: number,
  ): Promise<{ advancePaid: number }> {
    const order = await this.prisma.client.order.findFirst({ where: { id, orgId } });
    if (!order) throw new NotFoundException('Order not found');
    const updated = await this.prisma.client.order.update({
      where: { id },
      data: { advancePaid: { increment: BigInt(amountPaise) } },
    });

    await this.prisma.client.customer.update({
      where: { id: order.customerId },
      data: { outstandingAmount: { decrement: BigInt(amountPaise) } },
    });

    const customer = await this.prisma.client.customer.findUnique({
      where: { id: order.customerId },
      select: { name: true },
    });
    await this.accounting.onPaymentReceived({
      orgId,
      amountPaise: BigInt(amountPaise),
      customerName: customer?.name ?? 'Customer',
      date: new Date(),
    });

    return { advancePaid: Number(updated.advancePaid) };
  }
}
