import { Injectable } from '@nestjs/common';

import { LEDGER } from '../../common/accounting/ledger-codes';
import { PrismaService } from '../../common/prisma/prisma.service';

interface DashboardSummary {
  ordersInProduction: number;
  pendingJobCards: number;
  pendingAttendanceApproval: number;
  unreadNotifications: number;
  monthlyRevenue: number;  // current FY, paise
  monthlyExpenses: number; // current FY, paise
  outstandingReceivables: number; // paise
}

interface ProfitPerOrderRow {
  orderId: string;
  orderNumber: string;
  customer: string;
  revenue: number;
  // We don't yet track per-order cost of goods, so this is a rough estimate
  // based on materials consumed during the production window.
  estimatedCost: number;
  profit: number;
  margin: number; // percentage
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(orgId: string, userId: string): Promise<DashboardSummary> {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [
      ordersInProduction,
      pendingJobCards,
      pendingAttendance,
      unreadNotifications,
      salesAgg,
      expenseAgg,
      outstandingAgg,
    ] = await Promise.all([
      this.prisma.client.order.count({ where: { orgId, status: 'IN_PRODUCTION' } }),
      this.prisma.client.jobCard.count({
        where: { orgId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      }),
      this.prisma.client.attendanceRecord.count({
        where: { factoryOrgId: orgId, approvedBy: null },
      }),
      this.prisma.client.notification.count({ where: { userId, isRead: false } }),
      this.prisma.client.journalEntry.aggregate({
        where: {
          orgId,
          creditLedger: LEDGER.SALES_REVENUE,
          date: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.client.journalEntry.aggregate({
        where: {
          orgId,
          debitLedger: { startsWith: '5' }, // Expense ledgers
          date: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.client.customer.aggregate({
        where: { orgId },
        _sum: { outstandingAmount: true },
      }),
    ]);

    return {
      ordersInProduction,
      pendingJobCards,
      pendingAttendanceApproval: pendingAttendance,
      unreadNotifications,
      monthlyRevenue: Number(salesAgg._sum.amount ?? 0n),
      monthlyExpenses: Number(expenseAgg._sum.amount ?? 0n),
      outstandingReceivables: Number(outstandingAgg._sum.outstandingAmount ?? 0n),
    };
  }

  /**
   * Profit per order — revenue from the order minus an estimate of production cost.
   *
   * The cost side is best-effort until we track Bill of Materials per order:
   * we share raw material consumption for the period proportionally by order
   * revenue. Good enough for the owner to spot loss-making orders.
   */
  async profitPerOrder(orgId: string, from: Date, to: Date): Promise<ProfitPerOrderRow[]> {
    const orders = await this.prisma.client.order.findMany({
      where: {
        orgId,
        status: { in: ['DISPATCHED', 'DELIVERED'] },
        updatedAt: { gte: from, lte: to },
      },
      include: { customer: { select: { name: true } } },
    });

    // Total production cost in the period
    const expenseAgg = await this.prisma.client.journalEntry.aggregate({
      where: {
        orgId,
        debitLedger: { startsWith: '5' },
        date: { gte: from, lte: to },
      },
      _sum: { amount: true },
    });
    const totalCost = Number(expenseAgg._sum.amount ?? 0n);
    const totalRevenue = orders.reduce((a, o) => a + Number(o.totalValue), 0);

    return orders.map((o) => {
      const revenue = Number(o.totalValue);
      const share = totalRevenue > 0 ? revenue / totalRevenue : 0;
      const estimatedCost = Math.round(totalCost * share);
      const profit = revenue - estimatedCost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      return {
        orderId: o.id,
        orderNumber: o.orderNumber,
        customer: o.customer.name,
        revenue,
        estimatedCost,
        profit,
        margin,
      };
    });
  }

  async cashFlow(orgId: string, from: Date, to: Date): Promise<{
    inflow: number;
    outflow: number;
    net: number;
    daily: Array<{ date: string; inflow: number; outflow: number }>;
  }> {
    const [inAgg, outAgg, daily] = await Promise.all([
      this.prisma.client.journalEntry.aggregate({
        where: {
          orgId,
          debitLedger: LEDGER.BANK,
          date: { gte: from, lte: to },
        },
        _sum: { amount: true },
      }),
      this.prisma.client.journalEntry.aggregate({
        where: {
          orgId,
          creditLedger: LEDGER.BANK,
          date: { gte: from, lte: to },
        },
        _sum: { amount: true },
      }),
      this.prisma.client.journalEntry.findMany({
        where: {
          orgId,
          OR: [{ debitLedger: LEDGER.BANK }, { creditLedger: LEDGER.BANK }],
          date: { gte: from, lte: to },
        },
        select: { date: true, amount: true, debitLedger: true },
      }),
    ]);

    const bucket = new Map<string, { inflow: number; outflow: number }>();
    for (const row of daily) {
      const key = row.date.toISOString().slice(0, 10);
      const b = bucket.get(key) ?? { inflow: 0, outflow: 0 };
      if (row.debitLedger === LEDGER.BANK) b.inflow += Number(row.amount);
      else b.outflow += Number(row.amount);
      bucket.set(key, b);
    }

    return {
      inflow: Number(inAgg._sum.amount ?? 0n),
      outflow: Number(outAgg._sum.amount ?? 0n),
      net: Number(inAgg._sum.amount ?? 0n) - Number(outAgg._sum.amount ?? 0n),
      daily: Array.from(bucket.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v })),
    };
  }
}
