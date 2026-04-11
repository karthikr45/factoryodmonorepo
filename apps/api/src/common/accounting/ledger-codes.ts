/**
 * Chart of accounts seeded for every new FACTORY organisation.
 * Codes loosely follow the Indian standard chart. All amounts stored in paise.
 */
import type { LedgerType } from '@repo/types';

export interface LedgerSeed {
  code: string;
  name: string;
  type: LedgerType;
}

export const FACTORY_CHART_OF_ACCOUNTS: LedgerSeed[] = [
  // Assets
  { code: '1100', name: 'Bank', type: 'ASSET' },
  { code: '1110', name: 'Cash on Hand', type: 'ASSET' },
  { code: '1200', name: 'Accounts Receivable', type: 'ASSET' },
  { code: '1300', name: 'Raw Material Inventory', type: 'ASSET' },
  { code: '1310', name: 'Work in Progress', type: 'ASSET' },
  { code: '1320', name: 'Finished Goods', type: 'ASSET' },
  { code: '1400', name: 'Input GST (ITC)', type: 'ASSET' },

  // Liabilities
  { code: '2100', name: 'Accounts Payable', type: 'LIABILITY' },
  { code: '2200', name: 'Wages Payable', type: 'LIABILITY' },
  { code: '2210', name: 'EPF Payable', type: 'LIABILITY' },
  { code: '2220', name: 'ESIC Payable', type: 'LIABILITY' },
  { code: '2300', name: 'Output GST', type: 'LIABILITY' },
  { code: '2310', name: 'TDS Payable', type: 'LIABILITY' },

  // Equity
  { code: '3100', name: "Owner's Capital", type: 'EQUITY' },
  { code: '3200', name: 'Retained Earnings', type: 'EQUITY' },

  // Income
  { code: '4100', name: 'Sales Revenue', type: 'INCOME' },
  { code: '4200', name: 'Other Income', type: 'INCOME' },

  // Expenses
  { code: '5100', name: 'Wages Expense', type: 'EXPENSE' },
  { code: '5200', name: 'Raw Materials Consumed', type: 'EXPENSE' },
  { code: '5300', name: 'Power & Fuel', type: 'EXPENSE' },
  { code: '5400', name: 'Rent', type: 'EXPENSE' },
  { code: '5500', name: 'Freight Outward', type: 'EXPENSE' },
  { code: '5600', name: 'Administrative Expenses', type: 'EXPENSE' },
];

/**
 * Well-known ledger codes that the auto-accounting engine references.
 * Using these constants (not string literals) everywhere prevents typos.
 */
export const LEDGER = {
  BANK: '1100',
  ACCOUNTS_RECEIVABLE: '1200',
  RAW_MATERIAL_INVENTORY: '1300',
  INPUT_GST: '1400',
  ACCOUNTS_PAYABLE: '2100',
  WAGES_PAYABLE: '2200',
  EPF_PAYABLE: '2210',
  ESIC_PAYABLE: '2220',
  OUTPUT_GST: '2300',
  SALES_REVENUE: '4100',
  WAGES_EXPENSE: '5100',
} as const;
