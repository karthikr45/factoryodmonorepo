import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

interface QuotationItem { description: string; quantity: number; unit: string; unitPrice: number; gstRate: number; }

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, userId: string, input: {
    customerId: string; quotationNumber: string; items: QuotationItem[];
    validUntil: string; notes?: string;
  }): Promise<{ id: string; totalAmount: number }> {
    let subtotal = 0n;
    let gstAmount = 0n;
    for (const item of input.items) {
      const lineNet = BigInt(Math.round(item.unitPrice * item.quantity));
      const lineGst = (lineNet * BigInt(Math.round(item.gstRate * 100))) / 10_000n;
      subtotal += lineNet;
      gstAmount += lineGst;
    }
    const totalAmount = subtotal + gstAmount;

    const q = await this.prisma.client.quotation.create({
      data: {
        orgId, customerId: input.customerId, quotationNumber: input.quotationNumber,
        items: input.items as never, subtotal, gstAmount, totalAmount,
        validUntil: new Date(input.validUntil), notes: input.notes ?? null,
        createdBy: userId, status: 'DRAFT',
      },
    });
    return { id: q.id, totalAmount: Number(totalAmount) };
  }

  async list(orgId: string, status?: string): Promise<Array<{
    id: string; quotationNumber: string; customer: { id: string; name: string };
    totalAmount: number; status: string; validUntil: Date; createdAt: Date;
  }>> {
    const rows = await this.prisma.client.quotation.findMany({
      where: { orgId, ...(status ? { status: status as never } : {}) },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((q) => ({
      id: q.id, quotationNumber: q.quotationNumber, customer: q.customer,
      totalAmount: Number(q.totalAmount), status: q.status, validUntil: q.validUntil,
      createdAt: q.createdAt,
    }));
  }

  async convertToOrder(orgId: string, id: string, userId: string): Promise<{ orderId: string }> {
    const q = await this.prisma.client.quotation.findFirst({
      where: { id, orgId },
      include: { customer: true },
    });
    if (!q) throw new NotFoundException('Quotation not found');
    if (q.status === 'CONVERTED') throw new BadRequestException('Already converted to an order');

    const orderNumber = `ORD-${q.quotationNumber.replace('QTN-', '')}`;
    const order = await this.prisma.client.order.create({
      data: {
        orgId, customerId: q.customerId, orderNumber,
        productName: `From quotation ${q.quotationNumber}`,
        quantity: 1, unit: 'lot', deliveryDate: q.validUntil,
        totalValue: q.totalAmount, status: 'CONFIRMED', createdBy: userId,
      },
    });

    await this.prisma.client.quotation.update({
      where: { id },
      data: { status: 'CONVERTED', convertedOrderId: order.id },
    });

    return { orderId: order.id };
  }

  async updateStatus(orgId: string, id: string, status: string): Promise<{ id: string }> {
    const q = await this.prisma.client.quotation.findFirst({ where: { id, orgId } });
    if (!q) throw new NotFoundException('Quotation not found');
    await this.prisma.client.quotation.update({ where: { id }, data: { status: status as never } });
    return { id };
  }
}
