import { Injectable, NotFoundException } from '@nestjs/common';

import { LedgerType } from '@repo/types';
import type { CreateJournalEntryInput, CreateLedgerInput } from '@repo/validators';

import { PrismaService } from '../../common/prisma/prisma.service';

export interface TrialBalanceRow {
  code: string;
  name: string;
  type: LedgerType;
  debit: number;
  credit: number;
  balance: number; // signed — positive means debit balance
}

export interface ProfitAndLoss {
  income: TrialBalanceRow[];
  expense: TrialBalanceRow[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Ledgers ----

  async listLedgers(orgId: string): Promise<
    Array<{ id: string; code: string; name: string; type: LedgerType; isSystem: boolean }>
  > {
    const rows = await this.prisma.client.ledger.findMany({
      where: { orgId },
      orderBy: { code: 'asc' },
    });
    return rows.map((l) => ({
      id: l.id,
      code: l.code,
      name: l.name,
      type: l.type as LedgerType,
      isSystem: l.isSystem,
    }));
  }

  async createLedger(
    orgId: string,
    input: CreateLedgerInput,
  ): Promise<{ id: string }> {
    const l = await this.prisma.client.ledger.create({
      data: {
        orgId,
        code: input.code,
        name: input.name,
        type: input.type,
        parentId: input.parentId ?? null,
        isSystem: false,
      },
    });
    return { id: l.id };
  }

  // ---- Journal ----

  async listJournal(
    orgId: string,
    options: {
      from?: Date;
      to?: Date;
      ledgerCode?: string;
      page: number;
      pageSize: number;
    },
  ): Promise<{
    data: Array<{
      id: string;
      date: Date;
      description: string;
      debitLedger: string;
      creditLedger: string;
      amount: number;
      sourceType: string;
      createdAuto: boolean;
    }>;
    total: number;
  }> {
    const where = {
      orgId,
      ...(options.from || options.to
        ? {
            date: {
              ...(options.from ? { gte: options.from } : {}),
              ...(options.to ? { lte: options.to } : {}),
            },
          }
        : {}),
      ...(options.ledgerCode
        ? {
            OR: [
              { debitLedger: options.ledgerCode },
              { creditLedger: options.ledgerCode },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.journalEntry.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.client.journalEntry.count({ where }),
    ]);

    return {
      data: rows.map((j) => ({
        id: j.id,
        date: j.date,
        description: j.description,
        debitLedger: j.debitLedger,
        creditLedger: j.creditLedger,
        amount: Number(j.amount),
        sourceType: j.sourceType,
        createdAuto: j.createdAuto,
      })),
      total,
    };
  }

  async createJournalEntry(
    orgId: string,
    userId: string,
    input: CreateJournalEntryInput,
  ): Promise<{ id: string }> {
    // Ensure both ledgers exist for this org.
    const codes = [input.debitLedger, input.creditLedger];
    const existing = await this.prisma.client.ledger.findMany({
      where: { orgId, code: { in: codes } },
    });
    if (existing.length !== 2) {
      throw new NotFoundException('One or both ledger codes not found');
    }

    const entry = await this.prisma.client.journalEntry.create({
      data: {
        orgId,
        date: input.date,
        description: input.description,
        debitLedger: input.debitLedger,
        creditLedger: input.creditLedger,
        amount: BigInt(input.amount),
        sourceType: input.sourceType,
        sourceId: input.sourceId ?? null,
        financialYear: input.financialYear,
        createdAuto: false,
        createdBy: userId,
      },
    });
    return { id: entry.id };
  }

  // ---- Trial balance ----

  async trialBalance(orgId: string, asOf?: Date): Promise<TrialBalanceRow[]> {
    const where = { orgId, ...(asOf ? { date: { lte: asOf } } : {}) };

    const [ledgers, debits, credits] = await Promise.all([
      this.prisma.client.ledger.findMany({ where: { orgId }, orderBy: { code: 'asc' } }),
      this.prisma.client.journalEntry.groupBy({
        by: ['debitLedger'],
        where,
        _sum: { amount: true },
      }),
      this.prisma.client.journalEntry.groupBy({
        by: ['creditLedger'],
        where,
        _sum: { amount: true },
      }),
    ]);

    const dMap = new Map(debits.map((d) => [d.debitLedger, Number(d._sum.amount ?? 0n)]));
    const cMap = new Map(credits.map((c) => [c.creditLedger, Number(c._sum.amount ?? 0n)]));

    return ledgers.map((l) => {
      const debit = dMap.get(l.code) ?? 0;
      const credit = cMap.get(l.code) ?? 0;
      // Asset + Expense: DR balance positive. Liability + Income + Equity: CR balance positive.
      const natural =
        l.type === 'ASSET' || l.type === 'EXPENSE' ? debit - credit : credit - debit;
      return {
        code: l.code,
        name: l.name,
        type: l.type as LedgerType,
        debit,
        credit,
        balance: natural,
      };
    });
  }

  async profitAndLoss(orgId: string, from: Date, to: Date): Promise<ProfitAndLoss> {
    const rows = await this.trialBalance(orgId, to);
    // Only counts entries in the [from, to] range — re-pull for precision.
    const income = await this.prisma.client.journalEntry.groupBy({
      by: ['creditLedger'],
      where: { orgId, date: { gte: from, lte: to } },
      _sum: { amount: true },
    });
    const expense = await this.prisma.client.journalEntry.groupBy({
      by: ['debitLedger'],
      where: { orgId, date: { gte: from, lte: to } },
      _sum: { amount: true },
    });
    const ledgerMap = new Map(rows.map((r) => [r.code, r]));

    const incomeRows: TrialBalanceRow[] = [];
    const expenseRows: TrialBalanceRow[] = [];

    for (const row of income) {
      const l = ledgerMap.get(row.creditLedger);
      if (l?.type === 'INCOME') {
        incomeRows.push({ ...l, credit: Number(row._sum.amount ?? 0n), debit: 0 });
      }
    }
    for (const row of expense) {
      const l = ledgerMap.get(row.debitLedger);
      if (l?.type === 'EXPENSE') {
        expenseRows.push({ ...l, debit: Number(row._sum.amount ?? 0n), credit: 0 });
      }
    }

    const totalIncome = incomeRows.reduce((a, r) => a + r.credit, 0);
    const totalExpense = expenseRows.reduce((a, r) => a + r.debit, 0);
    return {
      income: incomeRows,
      expense: expenseRows,
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
    };
  }
}
