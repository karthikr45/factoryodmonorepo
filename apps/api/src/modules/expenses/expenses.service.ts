import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

export interface CreateExpenseInput {
  date: string;
  category: 'RENT' | 'UTILITIES' | 'TRAVEL' | 'OFFICE' | 'WAGES' | 'POWER' | 'FREIGHT' | 'OTHER';
  description: string;
  amountRupees: number;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CARD';
  vendorName?: string;
  notes?: string;
}

const CATEGORY_TO_LEDGER: Record<CreateExpenseInput['category'], string> = {
  RENT: '5400',
  POWER: '5300',
  WAGES: '5100',
  FREIGHT: '5500',
  UTILITIES: '5300',
  OFFICE: '5600',
  TRAVEL: '5600',
  OTHER: '5600',
};

/**
 * Non-PO expenses (rent, electricity, office supplies, …). Posts a single
 * journal entry: DR <expense ledger> / CR <bank or cash>. Sits next to the
 * accounting engine but is intentionally not a workflow — the accountant just
 * captures, and the books update.
 */
@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string, from?: Date, to?: Date): Promise<Array<{
    id: string; date: Date; category: string; description: string;
    amountPaise: number; paymentMethod: string; vendorName: string | null;
  }>> {
    const rows = await this.prisma.client.expense.findMany({
      where: {
        orgId,
        ...(from || to
          ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } }
          : {}),
      },
      orderBy: { date: 'desc' },
      take: 500,
    });
    return rows.map((e) => ({
      id: e.id, date: e.date, category: e.category, description: e.description,
      amountPaise: Number(e.amountPaise), paymentMethod: e.paymentMethod,
      vendorName: e.vendorName,
    }));
  }

  async create(orgId: string, userId: string, input: CreateExpenseInput): Promise<{ id: string }> {
    if (!(input.amountRupees > 0)) throw new BadRequestException('Amount must be greater than 0');
    if (!input.description?.trim()) throw new BadRequestException('Description is required');

    const ledgerCode = CATEGORY_TO_LEDGER[input.category];
    const amountPaise = BigInt(Math.round(input.amountRupees * 100));
    const date = new Date(input.date);
    const method = input.paymentMethod ?? 'BANK_TRANSFER';
    const creditLedger = method === 'CASH' ? '1110' : '1100';

    return this.prisma.client.$transaction(async (tx) => {
      const exp = await tx.expense.create({
        data: {
          orgId,
          date,
          category: input.category,
          description: input.description.trim(),
          amountPaise,
          paymentMethod: method,
          vendorName: input.vendorName ?? null,
          ledgerCode,
          notes: input.notes ?? null,
          createdBy: userId,
        },
      });

      // Post to journal: DR expense / CR cash-or-bank.
      const fy = this.financialYear(date);
      await tx.journalEntry.create({
        data: {
          orgId,
          date,
          description: `Expense — ${input.category} — ${input.description.trim().slice(0, 80)}`,
          debitLedger: ledgerCode,
          creditLedger,
          amount: amountPaise,
          sourceType: 'MANUAL',
          sourceId: exp.id,
          createdBy: userId,
          financialYear: fy,
        },
      });

      return { id: exp.id };
    });
  }

  /** India FY runs April–March; e.g. April 2026 → "2026-27". */
  private financialYear(d: Date): string {
    const m = d.getMonth();
    const y = d.getFullYear();
    return m >= 3
      ? `${y}-${String((y + 1) % 100).padStart(2, '0')}`
      : `${y - 1}-${String(y % 100).padStart(2, '0')}`;
  }
}
