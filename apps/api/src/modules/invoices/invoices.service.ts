import { Injectable, NotFoundException } from '@nestjs/common';

import { AccountingService } from '../../common/accounting/accounting.service';
import { PdfService } from '../../common/pdf/pdf.service';
import { PrismaService } from '../../common/prisma/prisma.service';

interface InvoiceItem { description: string; quantity: number; unit: string; unitPrice: number; gstRate: number; hsnCode?: string; }

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
    private readonly pdf: PdfService,
  ) {}

  async getPdf(orgId: string, id: string): Promise<{ buffer: Buffer; filename: string }> {
    const inv = await this.prisma.client.invoice.findFirst({
      where: { id, orgId },
      include: {
        customer: { select: { name: true, gstin: true, address: true, phone: true } },
        organisation: { select: { name: true, gstin: true } },
      },
    });
    if (!inv) throw new NotFoundException('Invoice not found');

    const items = (inv.items as Array<InvoiceItem>).map((it) => ({
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      unitPricePaise: it.unitPrice,
      gstRate: it.gstRate,
      hsnCode: it.hsnCode ?? null,
    }));

    const buffer = await this.pdf.buildInvoice({
      org: inv.organisation,
      invoice: {
        number: inv.invoiceNumber,
        date: inv.invoiceDate,
        dueDate: inv.dueDate,
        notes: inv.notes,
      },
      customer: inv.customer,
      items,
      summary: {
        netPaise: Number(inv.subtotal),
        gstPaise: Number(inv.gstAmount),
        totalPaise: Number(inv.totalAmount),
        paidPaise: Number(inv.paidAmount),
      },
    });
    return { buffer, filename: `${inv.invoiceNumber}.pdf` };
  }

  async create(orgId: string, userId: string, input: {
    orderId?: string; customerId: string; invoiceNumber: string;
    invoiceDate: string; dueDate?: string; items: InvoiceItem[]; notes?: string;
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

    const inv = await this.prisma.client.invoice.create({
      data: {
        orgId, orderId: input.orderId ?? null, customerId: input.customerId,
        invoiceNumber: input.invoiceNumber, invoiceDate: new Date(input.invoiceDate),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        items: input.items as never, subtotal, gstAmount, totalAmount,
        status: 'DRAFT', createdBy: userId, notes: input.notes ?? null,
      },
    });
    return { id: inv.id, totalAmount: Number(totalAmount) };
  }

  async list(orgId: string, status?: string): Promise<Array<{
    id: string; invoiceNumber: string; customer: { id: string; name: string };
    totalAmount: number; paidAmount: number; status: string; invoiceDate: Date; dueDate: Date | null;
  }>> {
    const rows = await this.prisma.client.invoice.findMany({
      where: { orgId, ...(status ? { status: status as never } : {}) },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((i) => ({
      id: i.id, invoiceNumber: i.invoiceNumber, customer: i.customer,
      totalAmount: Number(i.totalAmount), paidAmount: Number(i.paidAmount),
      status: i.status, invoiceDate: i.invoiceDate, dueDate: i.dueDate,
    }));
  }

  async recordPayment(orgId: string, id: string, amountPaise: number): Promise<{ newPaid: number; status: string }> {
    const inv = await this.prisma.client.invoice.findFirst({ where: { id, orgId } });
    if (!inv) throw new NotFoundException('Invoice not found');

    const newPaid = Number(inv.paidAmount) + amountPaise;
    const status = newPaid >= Number(inv.totalAmount) ? 'PAID' : 'PARTIALLY_PAID';

    await this.prisma.client.invoice.update({
      where: { id },
      data: { paidAmount: BigInt(newPaid), status: status as never },
    });

    // Record payment in journal
    const customer = await this.prisma.client.customer.findUnique({ where: { id: inv.customerId }, select: { name: true } });
    await this.accounting.onPaymentReceived({
      orgId, amountPaise: BigInt(amountPaise),
      customerName: customer?.name ?? 'Customer', date: new Date(),
    });

    return { newPaid, status };
  }

  async get(orgId: string, id: string): Promise<{
    id: string; invoiceNumber: string; invoiceDate: Date; dueDate: Date | null;
    customer: { id: string; name: string; gstin: string | null; address: string | null };
    items: InvoiceItem[]; subtotal: number; gstAmount: number; totalAmount: number;
    paidAmount: number; status: string; notes: string | null;
  }> {
    const inv = await this.prisma.client.invoice.findFirst({
      where: { id, orgId },
      include: { customer: { select: { id: true, name: true, gstin: true, address: true } } },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return {
      id: inv.id, invoiceNumber: inv.invoiceNumber, invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate, customer: inv.customer, items: inv.items as unknown as InvoiceItem[],
      subtotal: Number(inv.subtotal), gstAmount: Number(inv.gstAmount),
      totalAmount: Number(inv.totalAmount), paidAmount: Number(inv.paidAmount),
      status: inv.status, notes: inv.notes,
    };
  }
}
