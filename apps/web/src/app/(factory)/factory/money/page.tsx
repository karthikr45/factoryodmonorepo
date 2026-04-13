'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { apiCall } from '@/lib/api';
import { formatINR } from '@/lib/utils';

interface Dashboard {
  monthlyRevenue: number;
  monthlyExpenses: number;
  outstandingReceivables: number;
}

export default function MoneyLandingPage(): JSX.Element {
  const { data } = useQuery<Dashboard>({
    queryKey: ['dashboard'],
    queryFn: () => apiCall<Dashboard>({ url: '/reports/dashboard' }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Money</h1>
      <p className="mt-1 text-neutral-600">Invoices, payments, books, and reports — all in one place</p>

      {data && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="text-xs uppercase text-neutral-500">Revenue this month</div>
            <div className="mt-1 text-2xl font-semibold text-success-700">{formatINR(data.monthlyRevenue)}</div>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="text-xs uppercase text-neutral-500">Expenses this month</div>
            <div className="mt-1 text-2xl font-semibold text-danger-700">{formatINR(data.monthlyExpenses)}</div>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="text-xs uppercase text-neutral-500">Outstanding</div>
            <div className="mt-1 text-2xl font-semibold text-accent-600">{formatINR(data.outstandingReceivables)}</div>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/factory/money/invoices" className="group rounded-lg border border-neutral-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-xl">🧾</div>
          <h2 className="mt-4 text-lg font-semibold text-brand-900 group-hover:text-brand-700">Invoices</h2>
          <p className="mt-1 text-sm text-neutral-600">GST invoices and payment tracking</p>
        </Link>

        <Link href="/factory/money/finance" className="group rounded-lg border border-neutral-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-xl">📚</div>
          <h2 className="mt-4 text-lg font-semibold text-brand-900 group-hover:text-brand-700">Books</h2>
          <p className="mt-1 text-sm text-neutral-600">Journal, trial balance, profit & loss</p>
        </Link>

        <Link href="/factory/money/reports" className="group rounded-lg border border-neutral-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-xl">📊</div>
          <h2 className="mt-4 text-lg font-semibold text-brand-900 group-hover:text-brand-700">Reports</h2>
          <p className="mt-1 text-sm text-neutral-600">Cash flow, profit per order</p>
        </Link>

        <Link href="/factory/money/payroll" className="group rounded-lg border border-neutral-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-xl">💰</div>
          <h2 className="mt-4 text-lg font-semibold text-brand-900 group-hover:text-brand-700">Payroll</h2>
          <p className="mt-1 text-sm text-neutral-600">Monthly payroll for contract workers</p>
        </Link>
      </div>
    </div>
  );
}
