'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { apiCall } from '@/lib/api';
import { formatINR } from '@/lib/utils';

interface AgedReport {
  asOf: string;
  buckets: { label: string; amount: number; count: number }[];
  rows: Array<{
    invoiceId?: string;
    poId?: string;
    invoiceNumber?: string;
    poNumber?: string;
    customerName?: string;
    vendorName?: string;
    invoiceDate?: string;
    receivedDate?: string | null;
    dueDate?: string | null;
    daysOverdue?: number;
    daysOpen?: number;
    bucket: string;
    outstandingPaise?: number;
    amountPaise?: number;
  }>;
  totalOutstanding: number;
}

export default function AgedPage(): JSX.Element {
  const [tab, setTab] = useState<'receivables' | 'payables'>('receivables');

  const { data: receivables } = useQuery<AgedReport>({
    queryKey: ['aged-receivables'],
    queryFn: () => apiCall<AgedReport>({ url: '/finance/aged-receivables' }),
    enabled: tab === 'receivables',
  });
  const { data: payables } = useQuery<AgedReport>({
    queryKey: ['aged-payables'],
    queryFn: () => apiCall<AgedReport>({ url: '/finance/aged-payables' }),
    enabled: tab === 'payables',
  });

  const data = tab === 'receivables' ? receivables : payables;

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Aged report</h1>
      <p className="mt-1 text-neutral-600">Money you&rsquo;re owed and money you owe, bucketed by age.</p>

      <div className="mt-4 flex gap-2 border-b border-neutral-200">
        {[
          { key: 'receivables', label: 'Receivables (money in)' },
          { key: 'payables', label: 'Payables (money out)' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.key ? 'border-brand-700 text-brand-900' : 'border-transparent text-neutral-500 hover:text-brand-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="mt-12 text-center text-neutral-500">Loading…</div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            {data.buckets.map((b) => (
              <div key={b.label} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="text-xs uppercase tracking-wider text-neutral-500">{b.label}</div>
                <div className="mt-1 text-xl font-bold text-brand-900">{formatINR(b.amount)}</div>
                <div className="text-xs text-neutral-500">{b.count} {b.count === 1 ? 'item' : 'items'}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-4">
            <div className="text-sm text-brand-700">Total outstanding</div>
            <div className="text-2xl font-bold text-brand-900">{formatINR(data.totalOutstanding)}</div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">{tab === 'receivables' ? 'Invoice' : 'PO'}</th>
                  <th className="px-4 py-3 font-medium">{tab === 'receivables' ? 'Customer' : 'Vendor'}</th>
                  <th className="px-4 py-3 font-medium">{tab === 'receivables' ? 'Due' : 'Received'}</th>
                  <th className="px-4 py-3 font-medium text-right">Days</th>
                  <th className="px-4 py-3 font-medium">Bucket</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-500">Nothing in this bucket.</td></tr>
                ) : data.rows.map((r) => (
                  <tr key={r.invoiceId ?? r.poId} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-xs">{r.invoiceNumber ?? r.poNumber}</td>
                    <td className="px-4 py-3">{r.customerName ?? r.vendorName}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {tab === 'receivables'
                        ? r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : '—'
                        : r.receivedDate ? new Date(r.receivedDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className={`px-4 py-3 text-right ${(r.daysOverdue ?? r.daysOpen ?? 0) > 30 ? 'font-semibold text-danger-700' : ''}`}>
                      {r.daysOverdue ?? r.daysOpen}
                    </td>
                    <td className="px-4 py-3"><span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">{r.bucket}</span></td>
                    <td className="px-4 py-3 text-right font-semibold">{formatINR(r.outstandingPaise ?? r.amountPaise ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
