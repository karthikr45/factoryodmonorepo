'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { apiCall } from '@/lib/api';
import { formatINR, formatIST } from '@/lib/utils';

interface TrialBalanceRow {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debitLedger: string;
  creditLedger: string;
  amount: number;
  sourceType: string;
  createdAuto: boolean;
}

interface PnL {
  income: TrialBalanceRow[];
  expense: TrialBalanceRow[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export default function FinancePage(): JSX.Element {
  const [tab, setTab] = useState<'journal' | 'trial-balance' | 'pnl'>('journal');

  const now = new Date();
  const fyStart = now.getMonth() >= 3
    ? `${now.getFullYear()}-04-01`
    : `${now.getFullYear() - 1}-04-01`;
  const today = now.toISOString().slice(0, 10);

  const { data: journal } = useQuery<{ data: JournalEntry[]; total: number }>({
    queryKey: ['journal'],
    queryFn: () =>
      apiCall<{ data: JournalEntry[]; total: number }>({ url: '/finance/journal?pageSize=100' }),
    enabled: tab === 'journal',
  });

  const { data: tb } = useQuery<TrialBalanceRow[]>({
    queryKey: ['trial-balance'],
    queryFn: () => apiCall<TrialBalanceRow[]>({ url: '/finance/trial-balance' }),
    enabled: tab === 'trial-balance',
  });

  const { data: pnl } = useQuery<PnL>({
    queryKey: ['pnl'],
    queryFn: () =>
      apiCall<PnL>({ url: `/finance/profit-and-loss?from=${fyStart}&to=${today}` }),
    enabled: tab === 'pnl',
  });

  const tabs = [
    { key: 'journal', label: 'Journal' },
    { key: 'trial-balance', label: 'Trial Balance' },
    { key: 'pnl', label: 'Profit & Loss' },
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Finance</h1>
      <p className="mt-1 text-neutral-600">Auto-posted entries from operations + manual journal</p>

      <div className="mt-4 flex gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${tab === t.key ? 'border-brand-700 bg-brand-700 text-white' : 'border-neutral-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Journal entries */}
      {tab === 'journal' && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left"><tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Debit</th>
              <th className="px-4 py-3 font-medium">Credit</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium">Source</th>
            </tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {(journal?.data ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                  No journal entries yet. Dispatch an order or approve attendance to see auto-posted entries.
                </td></tr>
              ) : (journal?.data ?? []).map((j) => (
                <tr key={j.id}>
                  <td className="px-4 py-3 text-neutral-500">{formatIST(j.date).split(',')[0]}</td>
                  <td className="px-4 py-3">{j.description}</td>
                  <td className="px-4 py-3 font-mono text-xs">{j.debitLedger}</td>
                  <td className="px-4 py-3 font-mono text-xs">{j.creditLedger}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatINR(j.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      j.createdAuto ? 'bg-brand-50 text-brand-700' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {j.createdAuto ? 'Auto' : 'Manual'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trial Balance */}
      {tab === 'trial-balance' && tb && (
        <div className="mt-6 space-y-6">
          {['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'].map((type) => {
            const rows = tb.filter((r) => r.type === type);
            if (rows.length === 0) return null;
            return (
              <div key={type} className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                <div className="bg-neutral-50 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-neutral-600">{type}</div>
                <table className="w-full text-sm">
                  <thead className="text-left text-neutral-600"><tr>
                    <th className="px-4 py-2 font-medium">Code</th>
                    <th className="px-4 py-2 font-medium">Ledger</th>
                    <th className="px-4 py-2 font-medium text-right">Debit</th>
                    <th className="px-4 py-2 font-medium text-right">Credit</th>
                    <th className="px-4 py-2 font-medium text-right">Balance</th>
                  </tr></thead>
                  <tbody className="divide-y divide-neutral-100">
                    {rows.map((r) => (
                      <tr key={r.code}>
                        <td className="px-4 py-2 font-mono text-xs text-neutral-500">{r.code}</td>
                        <td className="px-4 py-2">{r.name}</td>
                        <td className="px-4 py-2 text-right">{r.debit > 0 ? formatINR(r.debit) : '—'}</td>
                        <td className="px-4 py-2 text-right">{r.credit > 0 ? formatINR(r.credit) : '—'}</td>
                        <td className="px-4 py-2 text-right font-semibold">{formatINR(Math.abs(r.balance))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* P&L */}
      {tab === 'pnl' && pnl && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="text-xs uppercase tracking-wider text-neutral-500">Total income</div>
              <div className="mt-1 text-2xl font-semibold text-success-700">{formatINR(pnl.totalIncome)}</div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="text-xs uppercase tracking-wider text-neutral-500">Total expenses</div>
              <div className="mt-1 text-2xl font-semibold text-danger-700">{formatINR(pnl.totalExpense)}</div>
            </div>
            <div className={`rounded-lg border p-5 ${pnl.netProfit >= 0 ? 'border-success-200 bg-success-50' : 'border-danger-200 bg-danger-50'}`}>
              <div className="text-xs uppercase tracking-wider text-neutral-500">Net profit</div>
              <div className={`mt-1 text-2xl font-semibold ${pnl.netProfit >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                {formatINR(Math.abs(pnl.netProfit))}
                {pnl.netProfit < 0 ? ' (Loss)' : ''}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <div className="bg-success-50 px-4 py-2 text-sm font-semibold uppercase text-success-700">Income</div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-neutral-100">
                  {pnl.income.map((r) => (
                    <tr key={r.code}><td className="px-4 py-2">{r.name}</td><td className="px-4 py-2 text-right font-semibold">{formatINR(r.credit)}</td></tr>
                  ))}
                  {pnl.income.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-neutral-500">No income recorded yet</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <div className="bg-danger-50 px-4 py-2 text-sm font-semibold uppercase text-danger-700">Expenses</div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-neutral-100">
                  {pnl.expense.map((r) => (
                    <tr key={r.code}><td className="px-4 py-2">{r.name}</td><td className="px-4 py-2 text-right font-semibold">{formatINR(r.debit)}</td></tr>
                  ))}
                  {pnl.expense.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-neutral-500">No expenses recorded yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
