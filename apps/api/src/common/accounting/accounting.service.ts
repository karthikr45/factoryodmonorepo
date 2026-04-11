import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { FACTORY_CHART_OF_ACCOUNTS, LEDGER } from './ledger-codes';

interface DispatchEvent {
  orgId: string;
  orderId: string;
  orderNumber: string;
  totalPaise: bigint;
  gstPaise: bigint;
  date: Date;
}

interface PurchaseReceivedEvent {
  orgId: string;
  poId: string;
  poNumber: string;
  totalPaise: bigint;
  gstPaise: bigint;
  date: Date;
}

interface AttendanceApprovedEvent {
  orgId: string;
  totalWagesPaise: bigint;
  periodLabel: string;
  date: Date;
}

interface PayrollPaidEvent {
  orgId: string;
  netPaise: bigint;
  epfPaise: bigint;
  esicPaise: bigint;
  date: Date;
  month: number;
  year: number;
}

interface PaymentReceivedEvent {
  orgId: string;
  amountPaise: bigint;
  customerName: string;
  date: Date;
}

/**
 * Auto-accounting engine.
 *
 * Every business event passes through here and writes a matching JournalEntry.
 * This is the "books write themselves" promise — never call the JournalEntry
 * table directly from a domain module. Go through this service.
 */
@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotently seed the chart of accounts for a new factory org.
   * Safe to call repeatedly — uses upsert by (orgId, code).
   */
  async seedChartOfAccounts(orgId: string): Promise<number> {
    let inserted = 0;
    for (const ledger of FACTORY_CHART_OF_ACCOUNTS) {
      const existing = await this.prisma.client.ledger.findUnique({
        where: { orgId_code: { orgId, code: ledger.code } },
      });
      if (!existing) {
        await this.prisma.client.ledger.create({
          data: { ...ledger, orgId, isSystem: true },
        });
        inserted++;
      }
    }
    this.logger.log(`Seeded ${inserted} ledgers for org ${orgId}`);
    return inserted;
  }

  // ========================================================================
  // Event handlers — every method is (orgId, eventData) → JournalEntry[]
  // ========================================================================

  /**
   * Order dispatched → Sale is recognized.
   *   DR Accounts Receivable   (total incl GST)
   *     CR Sales Revenue       (net)
   *     CR Output GST          (gst portion)
   */
  async onOrderDispatched(event: DispatchEvent): Promise<void> {
    const netPaise = event.totalPaise - event.gstPaise;
    const fy = this.financialYear(event.date);

    await this.prisma.client.journalEntry.createMany({
      data: [
        {
          orgId: event.orgId,
          date: event.date,
          description: `Sale — Order ${event.orderNumber}`,
          debitLedger: LEDGER.ACCOUNTS_RECEIVABLE,
          creditLedger: LEDGER.SALES_REVENUE,
          amount: netPaise,
          sourceType: 'ORDER',
          sourceId: event.orderId,
          createdAuto: true,
          financialYear: fy,
        },
        {
          orgId: event.orgId,
          date: event.date,
          description: `Output GST — Order ${event.orderNumber}`,
          debitLedger: LEDGER.ACCOUNTS_RECEIVABLE,
          creditLedger: LEDGER.OUTPUT_GST,
          amount: event.gstPaise,
          sourceType: 'ORDER',
          sourceId: event.orderId,
          createdAuto: true,
          financialYear: fy,
        },
      ],
    });

    // Update customer outstanding.
    const order = await this.prisma.client.order.findUnique({
      where: { id: event.orderId },
      select: { customerId: true },
    });
    if (order) {
      await this.prisma.client.customer.update({
        where: { id: order.customerId },
        data: { outstandingAmount: { increment: event.totalPaise } },
      });
    }
  }

  /**
   * Purchase received → GRN.
   *   DR Raw Material Inventory (net)
   *   DR Input GST              (gst portion)
   *     CR Accounts Payable     (total)
   */
  async onPurchaseReceived(event: PurchaseReceivedEvent): Promise<void> {
    const netPaise = event.totalPaise - event.gstPaise;
    const fy = this.financialYear(event.date);

    await this.prisma.client.journalEntry.createMany({
      data: [
        {
          orgId: event.orgId,
          date: event.date,
          description: `Goods received — PO ${event.poNumber}`,
          debitLedger: LEDGER.RAW_MATERIAL_INVENTORY,
          creditLedger: LEDGER.ACCOUNTS_PAYABLE,
          amount: netPaise,
          sourceType: 'PURCHASE',
          sourceId: event.poId,
          createdAuto: true,
          financialYear: fy,
        },
        {
          orgId: event.orgId,
          date: event.date,
          description: `Input GST — PO ${event.poNumber}`,
          debitLedger: LEDGER.INPUT_GST,
          creditLedger: LEDGER.ACCOUNTS_PAYABLE,
          amount: event.gstPaise,
          sourceType: 'PURCHASE',
          sourceId: event.poId,
          createdAuto: true,
          financialYear: fy,
        },
      ],
    });
  }

  /**
   * Attendance approved for a batch of records → wages accrual.
   *   DR Wages Expense
   *     CR Wages Payable
   */
  async onAttendanceApproved(event: AttendanceApprovedEvent): Promise<void> {
    if (event.totalWagesPaise <= 0n) return;
    const fy = this.financialYear(event.date);

    await this.prisma.client.journalEntry.create({
      data: {
        orgId: event.orgId,
        date: event.date,
        description: `Wages accrual — ${event.periodLabel}`,
        debitLedger: LEDGER.WAGES_EXPENSE,
        creditLedger: LEDGER.WAGES_PAYABLE,
        amount: event.totalWagesPaise,
        sourceType: 'ATTENDANCE',
        sourceId: null,
        createdAuto: true,
        financialYear: fy,
      },
    });
  }

  /**
   * Payroll paid.
   *   DR Wages Payable  (net)
   *   DR EPF Payable    (employee share from wages was already accrued, this covers employer)
   *   DR ESIC Payable
   *     CR Bank          (net paid out)
   */
  async onPayrollPaid(event: PayrollPaidEvent): Promise<void> {
    const fy = this.financialYear(event.date);
    const label = `${event.month}/${event.year}`;

    const entries = [
      {
        orgId: event.orgId,
        date: event.date,
        description: `Payroll net paid — ${label}`,
        debitLedger: LEDGER.WAGES_PAYABLE,
        creditLedger: LEDGER.BANK,
        amount: event.netPaise,
        sourceType: 'ATTENDANCE' as const,
        sourceId: null,
        createdAuto: true,
        financialYear: fy,
      },
    ];
    if (event.epfPaise > 0n) {
      entries.push({
        orgId: event.orgId,
        date: event.date,
        description: `EPF deduction remit — ${label}`,
        debitLedger: LEDGER.WAGES_PAYABLE,
        creditLedger: LEDGER.EPF_PAYABLE,
        amount: event.epfPaise,
        sourceType: 'ATTENDANCE' as const,
        sourceId: null,
        createdAuto: true,
        financialYear: fy,
      });
    }
    if (event.esicPaise > 0n) {
      entries.push({
        orgId: event.orgId,
        date: event.date,
        description: `ESIC deduction remit — ${label}`,
        debitLedger: LEDGER.WAGES_PAYABLE,
        creditLedger: LEDGER.ESIC_PAYABLE,
        amount: event.esicPaise,
        sourceType: 'ATTENDANCE' as const,
        sourceId: null,
        createdAuto: true,
        financialYear: fy,
      });
    }

    await this.prisma.client.journalEntry.createMany({ data: entries });
  }

  /**
   * Customer payment received.
   *   DR Bank
   *     CR Accounts Receivable
   */
  async onPaymentReceived(event: PaymentReceivedEvent): Promise<void> {
    const fy = this.financialYear(event.date);
    await this.prisma.client.journalEntry.create({
      data: {
        orgId: event.orgId,
        date: event.date,
        description: `Payment received — ${event.customerName}`,
        debitLedger: LEDGER.BANK,
        creditLedger: LEDGER.ACCOUNTS_RECEIVABLE,
        amount: event.amountPaise,
        sourceType: 'MANUAL',
        sourceId: null,
        createdAuto: true,
        financialYear: fy,
      },
    });
  }

  /**
   * Indian financial year string, e.g. Date(2025-07-15) → "2025-26".
   * FY runs April 1 – March 31.
   */
  private financialYear(date: Date): string {
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    const startYear = month >= 4 ? year : year - 1;
    return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
  }
}
