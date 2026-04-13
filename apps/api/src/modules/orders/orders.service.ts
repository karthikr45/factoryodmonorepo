import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

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
      ...(options.status ? { status: options.status as never } : {}),
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

  /**
   * Full order lifecycle — quotation + job cards + QC + dispatch + invoice + payments,
   * all in one call. This is what the unified order detail page loads.
   */
  async getLifecycle(orgId: string, id: string): Promise<{
    order: {
      id: string; orderNumber: string; productName: string; quantity: number;
      unit: string; status: string; deliveryDate: Date; totalValue: number;
      advancePaid: number; notes: string | null; createdAt: Date;
      customer: { id: string; name: string; phone: string; gstin: string | null };
    };
    quotation: { id: string; quotationNumber: string; status: string; totalAmount: number; validUntil: Date } | null;
    jobCards: Array<{
      id: string; status: string;
      department: { id: string; name: string; sequence: number };
      startedAt: Date | null; completedAt: Date | null;
    }>;
    qualityChecks: Array<{ id: string; status: string; defectNotes: string | null; inspectedAt: Date | null }>;
    dispatches: Array<{
      id: string; vehicleNumber: string | null; driverName: string | null;
      ewayBillNumber: string | null; dispatchDate: Date; deliveredAt: Date | null; status: string;
    }>;
    invoice: {
      id: string; invoiceNumber: string; status: string;
      totalAmount: number; paidAmount: number; invoiceDate: Date; dueDate: Date | null;
    } | null;
    nextAction: { label: string; type: string } | null;
  }> {
    const order = await this.prisma.client.order.findFirst({
      where: { id, orgId },
      include: {
        customer: { select: { id: true, name: true, phone: true, gstin: true } },
        jobCards: {
          include: { department: { select: { id: true, name: true, sequence: true } } },
          orderBy: { department: { sequence: 'asc' } },
        },
        qualityChecks: { orderBy: { createdAt: 'desc' } },
        dispatches: { orderBy: { dispatchDate: 'desc' } },
        invoices: { orderBy: { createdAt: 'desc' }, take: 1 },
        quotation: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Suggest the next action based on current status
    let nextAction: { label: string; type: string } | null = null;
    switch (order.status) {
      case 'ENQUIRY':
        nextAction = { label: 'Create quotation', type: 'CREATE_QUOTATION' };
        break;
      case 'CONFIRMED':
        if (order.jobCards.length === 0) {
          nextAction = { label: 'Generate job cards', type: 'GENERATE_JOB_CARDS' };
        } else {
          nextAction = { label: 'Start production', type: 'START_PRODUCTION' };
        }
        break;
      case 'IN_PRODUCTION': {
        const pending = order.jobCards.filter((jc) => jc.status !== 'COMPLETED').length;
        nextAction = { label: `${pending} job cards remaining`, type: 'WORK_JOB_CARDS' };
        break;
      }
      case 'QUALITY_CHECK':
        nextAction = { label: 'Run quality check', type: 'QUALITY_CHECK' };
        break;
      case 'READY':
        nextAction = { label: 'Dispatch order', type: 'DISPATCH' };
        break;
      case 'DISPATCHED':
        nextAction = { label: 'Mark delivered', type: 'DELIVERED' };
        break;
      case 'DELIVERED':
        if (order.invoices[0] && Number(order.invoices[0].paidAmount) < Number(order.invoices[0].totalAmount)) {
          nextAction = { label: 'Record payment', type: 'RECORD_PAYMENT' };
        }
        break;
      default:
        nextAction = null;
    }

    return {
      order: {
        id: order.id, orderNumber: order.orderNumber,
        productName: order.productName, quantity: order.quantity, unit: order.unit,
        status: order.status, deliveryDate: order.deliveryDate,
        totalValue: Number(order.totalValue), advancePaid: Number(order.advancePaid),
        notes: order.notes, createdAt: order.createdAt, customer: order.customer,
      },
      quotation: order.quotation ? {
        id: order.quotation.id, quotationNumber: order.quotation.quotationNumber,
        status: order.quotation.status, totalAmount: Number(order.quotation.totalAmount),
        validUntil: order.quotation.validUntil,
      } : null,
      jobCards: order.jobCards.map((jc) => ({
        id: jc.id, status: jc.status, department: jc.department,
        startedAt: jc.startedAt, completedAt: jc.completedAt,
      })),
      qualityChecks: order.qualityChecks.map((qc) => ({
        id: qc.id, status: qc.status, defectNotes: qc.defectNotes, inspectedAt: qc.inspectedAt,
      })),
      dispatches: order.dispatches.map((d) => ({
        id: d.id, vehicleNumber: d.vehicleNumber, driverName: d.driverName,
        ewayBillNumber: d.ewayBillNumber, dispatchDate: d.dispatchDate,
        deliveredAt: d.deliveredAt, status: d.status,
      })),
      invoice: order.invoices[0] ? {
        id: order.invoices[0].id, invoiceNumber: order.invoices[0].invoiceNumber,
        status: order.invoices[0].status, totalAmount: Number(order.invoices[0].totalAmount),
        paidAmount: Number(order.invoices[0].paidAmount),
        invoiceDate: order.invoices[0].invoiceDate, dueDate: order.invoices[0].dueDate,
      } : null,
      nextAction,
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

  /**
   * Create an order in one atomic call. The caller can either:
   *  - pass `customerId` to use an existing customer, OR
   *  - pass `customer: { name, phone, ...}` to create the customer first
   *
   * Wrapped in a Prisma transaction so we never end up with an orphan
   * customer if order creation fails.
   */
  async createWithCustomer(
    orgId: string,
    userId: string,
    input: {
      customerId?: string;
      customer?: { name: string; phone: string; gstin?: string; email?: string; address?: string };
      orderNumber: string;
      productName: string;
      quantity: number;
      unit: string;
      deliveryDate: string | Date;
      totalValue: number;
      advancePaid?: number;
      notes?: string;
    },
  ): Promise<{ id: string; customerId: string }> {
    if (!input.customerId && !input.customer) {
      throw new BadRequestException('Either customerId or customer details required');
    }

    return this.prisma.client.$transaction(async (tx) => {
      // Step 1: get or create the customer
      let customerId = input.customerId;
      if (!customerId && input.customer) {
        // Reuse if a customer with this phone already exists in the org
        const existing = await tx.customer.findFirst({
          where: { orgId, phone: input.customer.phone },
        });
        if (existing) {
          customerId = existing.id;
        } else {
          const created = await tx.customer.create({
            data: {
              orgId,
              name: input.customer.name,
              phone: input.customer.phone,
              gstin: input.customer.gstin ?? null,
              email: input.customer.email ?? null,
              address: input.customer.address ?? null,
              creditLimit: 0n,
            },
          });
          customerId = created.id;
        }
      } else {
        // Verify the customer belongs to this org
        const existing = await tx.customer.findFirst({
          where: { id: customerId, orgId },
        });
        if (!existing) throw new BadRequestException('Customer not found in this organisation');
      }

      // Step 2: check the order number is unique for this org
      const dupe = await tx.order.findFirst({
        where: { orgId, orderNumber: input.orderNumber },
      });
      if (dupe) throw new BadRequestException(`Order number "${input.orderNumber}" already exists`);

      // Step 3: create the order
      const order = await tx.order.create({
        data: {
          orgId,
          customerId: customerId!,
          orderNumber: input.orderNumber,
          productName: input.productName,
          quantity: input.quantity,
          unit: input.unit,
          deliveryDate: new Date(input.deliveryDate),
          totalValue: BigInt(input.totalValue),
          advancePaid: BigInt(input.advancePaid ?? 0),
          notes: input.notes ?? null,
          createdBy: userId,
          status: 'ENQUIRY',
        },
      });

      this.gateway.emitToOrg(orgId, 'order:created', { id: order.id });
      return { id: order.id, customerId: customerId! };
    });
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

    // --- Auto-triggers based on new status ---

    if (input.status === OrderStatus.CONFIRMED) {
      // Auto-generate job cards for every active department
      const departments = await this.prisma.client.department.findMany({
        where: { orgId, isActive: true },
        orderBy: { sequence: 'asc' },
      });
      if (departments.length > 0) {
        await this.prisma.client.jobCard.createMany({
          data: departments.map((d) => ({
            orderId: id,
            departmentId: d.id,
            orgId,
            status: 'PENDING' as const,
          })),
        });
      }
    }

    if (input.status === OrderStatus.DISPATCHED) {
      // Auto-accounting: sale + GST
      const gstPaise = (existing.totalValue * 18n) / 118n;
      await this.accounting.onOrderDispatched({
        orgId,
        orderId: id,
        orderNumber: existing.orderNumber,
        totalPaise: existing.totalValue,
        gstPaise,
        date: new Date(),
      });

      // Auto-create invoice
      const customer = await this.prisma.client.customer.findUnique({
        where: { id: existing.customerId },
      });
      const invNumber = `INV-${existing.orderNumber.replace('ORD-', '')}`;
      const netPaise = existing.totalValue - gstPaise;
      try {
        await this.prisma.client.invoice.create({
          data: {
            orgId,
            orderId: id,
            customerId: existing.customerId,
            invoiceNumber: invNumber,
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 86_400_000), // Net 30
            items: [{
              description: existing.productName,
              quantity: existing.quantity,
              unit: existing.unit,
              unitPrice: Number(netPaise) / existing.quantity,
              gstRate: 18,
            }] as never,
            subtotal: netPaise,
            gstAmount: gstPaise,
            totalAmount: existing.totalValue,
            status: 'SENT',
            createdBy: userId,
          },
        });
      } catch {
        // Invoice number conflict — skip if already created
      }
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
