import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { GSTReturnType } from '@repo/types';
import type { GenerateGstReturnInput } from '@repo/validators';

import { LEDGER } from '../../common/accounting/ledger-codes';
import { PrismaService } from '../../common/prisma/prisma.service';

import { getGspProvider } from './gsp-provider';

interface Gstr1Summary {
  period: string;
  totalTaxableValue: number; // paise
  totalGst: number;          // paise
  invoiceCount: number;
  b2b: Array<{
    customerGstin: string | null;
    customerName: string;
    taxableValue: number;
    gst: number;
    count: number;
  }>;
}

interface Gstr3bSummary {
  period: string;
  outputGst: number; // paise (liability)
  inputGst: number;  // paise (ITC)
  netPayable: number;
}

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async listReturns(orgId: string): Promise<
    Array<{
      id: string;
      period: string;
      type: GSTReturnType;
      status: string;
      filedAt: Date | null;
    }>
  > {
    const rows = await this.prisma.client.gSTReturn.findMany({
      where: { orgId },
      orderBy: [{ period: 'desc' }, { type: 'asc' }],
    });
    return rows.map((r) => ({
      id: r.id,
      period: r.period,
      type: r.type as GSTReturnType,
      status: r.status,
      filedAt: r.filedAt,
    }));
  }

  async generateReturn(
    orgId: string,
    input: GenerateGstReturnInput,
  ): Promise<{ id: string; summary: Gstr1Summary | Gstr3bSummary }> {
    const { from, to } = this.monthToRange(input.period);

    let summary: Gstr1Summary | Gstr3bSummary;
    if (input.type === GSTReturnType.GSTR1) {
      summary = await this.generateGstr1(orgId, input.period, from, to);
    } else if (input.type === GSTReturnType.GSTR3B) {
      summary = await this.generateGstr3b(orgId, input.period, from, to);
    } else {
      throw new NotFoundException('GSTR-9 generator not yet implemented');
    }

    const existing = await this.prisma.client.gSTReturn.findUnique({
      where: { orgId_period_type: { orgId, period: input.period, type: input.type } },
    });
    const record = existing
      ? await this.prisma.client.gSTReturn.update({
          where: { id: existing.id },
          data: { data: summary as unknown as object, status: 'DRAFT' },
        })
      : await this.prisma.client.gSTReturn.create({
          data: {
            orgId,
            period: input.period,
            type: input.type,
            status: 'DRAFT',
            data: summary as unknown as object,
          },
        });

    return { id: record.id, summary };
  }

  async markFiled(
    orgId: string,
    id: string,
    userId: string,
  ): Promise<{ id: string }> {
    const r = await this.prisma.client.gSTReturn.findFirst({ where: { id, orgId } });
    if (!r) throw new NotFoundException('Return not found');
    await this.prisma.client.gSTReturn.update({
      where: { id },
      data: { status: 'FILED', filedAt: new Date(), filedBy: userId },
    });
    return { id };
  }

  /**
   * Push a generated return to the GSP. Updates status to FILED on success
   * and stores the acknowledgement number returned by the portal.
   */
  async fileWithGsp(orgId: string, id: string, userId: string): Promise<{
    id: string;
    acknowledgmentNumber: string;
    filedAt: Date;
    provider: string;
  }> {
    const r = await this.prisma.client.gSTReturn.findFirst({
      where: { id, orgId },
      include: { organisation: { select: { gstin: true } } },
    });
    if (!r) throw new NotFoundException('Return not found');
    if (!r.organisation.gstin) throw new BadRequestException('Org has no GSTIN — set it before filing');
    if (r.status === 'FILED') throw new BadRequestException('Return is already filed');

    const provider = getGspProvider();
    const result = r.type === GSTReturnType.GSTR1
      ? await provider.pushGstr1(r.organisation.gstin, r.period, r.data)
      : await provider.pushGstr3b(r.organisation.gstin, r.period, r.data);

    await this.prisma.client.gSTReturn.update({
      where: { id },
      data: {
        status: 'FILED',
        filedAt: result.filedAt,
        filedBy: userId,
        // Stash the ack number + provider payload back into the data blob so
        // CAs can audit who pushed what when.
        data: { ...(r.data as Record<string, unknown>), gspResult: result } as never,
      },
    });

    return { id, acknowledgmentNumber: result.acknowledgmentNumber, filedAt: result.filedAt, provider: provider.name };
  }

  /**
   * Generate an e-invoice (IRN + QR) for a single sales invoice via the
   * configured IRP. Stores the IRN on the Invoice row.
   */
  async generateEInvoice(orgId: string, invoiceId: string): Promise<{
    invoiceId: string;
    irn: string;
    ackNumber: string;
    qrCode: string;
  }> {
    const inv = await this.prisma.client.invoice.findFirst({
      where: { id: invoiceId, orgId },
      include: {
        customer: { select: { gstin: true } },
        organisation: { select: { gstin: true } },
      },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    if (!inv.organisation.gstin) throw new BadRequestException('Org has no GSTIN');

    const items = (inv.items as Array<{ description: string; quantity: number; unit: string; unitPrice: number; gstRate: number; hsnCode?: string | null }>).map((it) => ({
      description: it.description,
      hsnCode: it.hsnCode ?? null,
      quantity: it.quantity,
      unit: it.unit,
      unitPricePaise: it.unitPrice,
      gstRate: it.gstRate,
    }));

    const provider = getGspProvider();
    const result = await provider.generateEInvoice({
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      sellerGstin: inv.organisation.gstin,
      buyerGstin: inv.customer.gstin,
      totalPaise: Number(inv.totalAmount),
      gstPaise: Number(inv.gstAmount),
      items,
    });

    await this.prisma.client.invoice.update({
      where: { id: inv.id },
      data: {
        einvoiceJson: {
          irn: result.irn,
          ackNumber: result.ackNumber,
          ackDate: result.ackDate,
          qrCode: result.qrCode,
          provider: provider.name,
        } as never,
      },
    });

    return { invoiceId: inv.id, irn: result.irn, ackNumber: result.ackNumber, qrCode: result.qrCode };
  }

  // -----------------------------------------------------------------

  private async generateGstr1(
    orgId: string,
    period: string,
    from: Date,
    to: Date,
  ): Promise<Gstr1Summary> {
    // All sales (outbound invoices) in the period come from DISPATCHED orders.
    const orders = await this.prisma.client.order.findMany({
      where: {
        orgId,
        status: { in: ['DISPATCHED', 'DELIVERED'] },
        updatedAt: { gte: from, lt: to },
      },
      include: { customer: true },
    });

    const byCustomer = new Map<
      string,
      { customerGstin: string | null; customerName: string; taxableValue: bigint; gst: bigint; count: number }
    >();

    let totalTaxableValue = 0n;
    let totalGst = 0n;

    for (const o of orders) {
      // Same assumption as accounting engine: 18% inclusive GST.
      const gst = (o.totalValue * 18n) / 118n;
      const taxable = o.totalValue - gst;
      totalTaxableValue += taxable;
      totalGst += gst;

      const key = o.customer.gstin ?? o.customer.id;
      const entry = byCustomer.get(key) ?? {
        customerGstin: o.customer.gstin,
        customerName: o.customer.name,
        taxableValue: 0n,
        gst: 0n,
        count: 0,
      };
      entry.taxableValue += taxable;
      entry.gst += gst;
      entry.count += 1;
      byCustomer.set(key, entry);
    }

    return {
      period,
      totalTaxableValue: Number(totalTaxableValue),
      totalGst: Number(totalGst),
      invoiceCount: orders.length,
      b2b: Array.from(byCustomer.values()).map((v) => ({
        ...v,
        taxableValue: Number(v.taxableValue),
        gst: Number(v.gst),
      })),
    };
  }

  private async generateGstr3b(
    orgId: string,
    period: string,
    from: Date,
    to: Date,
  ): Promise<Gstr3bSummary> {
    const [outputRows, inputRows] = await Promise.all([
      this.prisma.client.journalEntry.groupBy({
        by: ['creditLedger'],
        where: { orgId, creditLedger: LEDGER.OUTPUT_GST, date: { gte: from, lt: to } },
        _sum: { amount: true },
      }),
      this.prisma.client.journalEntry.groupBy({
        by: ['debitLedger'],
        where: { orgId, debitLedger: LEDGER.INPUT_GST, date: { gte: from, lt: to } },
        _sum: { amount: true },
      }),
    ]);

    const outputGst = Number(outputRows[0]?._sum.amount ?? 0n);
    const inputGst = Number(inputRows[0]?._sum.amount ?? 0n);
    return {
      period,
      outputGst,
      inputGst,
      netPayable: Math.max(0, outputGst - inputGst),
    };
  }

  private monthToRange(period: string): { from: Date; to: Date } {
    // Period format: "YYYY-MM"
    const [yStr, mStr] = period.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    return {
      from: new Date(Date.UTC(y, m - 1, 1)),
      to: new Date(Date.UTC(y, m, 1)),
    };
  }
}
