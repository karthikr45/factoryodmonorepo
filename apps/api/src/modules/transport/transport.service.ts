import { Injectable, NotFoundException } from '@nestjs/common';

import { AccountingService } from '../../common/accounting/accounting.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TransportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
  ) {}

  // ---- Transporters ----
  async listTransporters(orgId: string): Promise<Array<{
    id: string; name: string; phone: string; vehicleNumber: string | null; vehicleType: string | null; isActive: boolean;
  }>> {
    return this.prisma.client.transporter.findMany({ where: { orgId, isActive: true }, orderBy: { name: 'asc' } });
  }

  async createTransporter(orgId: string, input: {
    name: string; phone: string; vehicleNumber?: string; vehicleType?: string;
  }): Promise<{ id: string }> {
    const t = await this.prisma.client.transporter.create({
      data: { orgId, name: input.name, phone: input.phone, vehicleNumber: input.vehicleNumber ?? null, vehicleType: input.vehicleType ?? null },
    });
    return { id: t.id };
  }

  // ---- Dispatches ----
  async createDispatch(orgId: string, input: {
    orderId: string; transporterId?: string; vehicleNumber?: string;
    driverName?: string; driverPhone?: string; ewayBillNumber?: string;
    expectedDeliveryDate?: string; freightCostRupees?: number; notes?: string;
  }): Promise<{ id: string }> {
    const order = await this.prisma.client.order.findFirst({ where: { id: input.orderId, orgId } });
    if (!order) throw new NotFoundException('Order not found');

    const d = await this.prisma.client.dispatch.create({
      data: {
        orgId, orderId: input.orderId,
        transporterId: input.transporterId ?? null,
        vehicleNumber: input.vehicleNumber ?? null,
        driverName: input.driverName ?? null,
        driverPhone: input.driverPhone ?? null,
        ewayBillNumber: input.ewayBillNumber ?? null,
        dispatchDate: new Date(),
        expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : null,
        freightCost: BigInt(Math.round((input.freightCostRupees ?? 0) * 100)),
        status: 'DISPATCHED',
        notes: input.notes ?? null,
      },
    });
    return { id: d.id };
  }

  async markDelivered(orgId: string, id: string, proofUrl?: string): Promise<{ id: string }> {
    const d = await this.prisma.client.dispatch.findFirst({ where: { id, orgId } });
    if (!d) throw new NotFoundException('Dispatch not found');

    await this.prisma.client.dispatch.update({
      where: { id },
      data: { status: 'DELIVERED', deliveredAt: new Date(), proofOfDeliveryUrl: proofUrl ?? null },
    });

    // Mark the order as delivered too
    await this.prisma.client.order.update({ where: { id: d.orderId }, data: { status: 'DELIVERED' } });
    return { id };
  }

  async listDispatches(orgId: string, status?: string): Promise<Array<{
    id: string; order: { id: string; orderNumber: string; customer: { name: string } };
    vehicleNumber: string | null; driverName: string | null; status: string;
    dispatchDate: Date; expectedDeliveryDate: Date | null; deliveredAt: Date | null;
    freightCost: number;
  }>> {
    const rows = await this.prisma.client.dispatch.findMany({
      where: { orgId, ...(status ? { status: status as never } : {}) },
      include: { order: { include: { customer: { select: { name: true } } } } },
      orderBy: { dispatchDate: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      order: { id: r.order.id, orderNumber: r.order.orderNumber, customer: r.order.customer },
      vehicleNumber: r.vehicleNumber, driverName: r.driverName, status: r.status,
      dispatchDate: r.dispatchDate, expectedDeliveryDate: r.expectedDeliveryDate,
      deliveredAt: r.deliveredAt, freightCost: Number(r.freightCost),
    }));
  }
}
