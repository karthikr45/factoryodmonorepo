import { Injectable, NotFoundException } from '@nestjs/common';

import { GSTReturnType } from '@repo/types';
import type { GenerateGstReturnInput } from '@repo/validators';

import { LEDGER } from '../../common/accounting/ledger-codes';
import { PrismaService } from '../../common/prisma/prisma.service';

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
