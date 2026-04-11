import { cookies } from 'next/headers';
import Link from 'next/link';

import { apiCallServer } from '@/lib/api';
import { ACCESS_COOKIE, getCurrentUser } from '@/lib/auth';
import { formatINR } from '@/lib/utils';
import { redirect } from 'next/navigation';

interface TrialBalanceRow {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

async function fetchTrialBalance(): Promise<TrialBalanceRow[]> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  return apiCallServer<TrialBalanceRow[]>('/finance/trial-balance', {
    accessToken: token,
  });
}

export default async function CaDashboardPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'CA') redirect('/login');

  const rows = await fetchTrialBalance().catch(() => [] as TrialBalanceRow[]);

  const totalDebit = rows.reduce((a, r) => a + r.debit, 0);
  const totalCredit = rows.reduce((a, r) => a + r.credit, 0);
  const balanced = totalDebit === totalCredit;

  const byType = new Map<string, TrialBalanceRow[]>();
  for (const r of rows) {
    const list = byType.get(r.type) ?? [];
    list.push(r);
    byType.set(r.type, list);
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Live books</h1>
          <p className="mt-1 text-neutral-600">
            Every business event posts to the journal automatically. No stale Tally files.
          </p>
        </div>
        <Link
          href="/ca/gst"
          className="rounded-md border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
        >
          GST returns
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-xs uppercase tracking-wider text-neutral-500">
            Total debits
          </div>
          <div className="mt-1 text-xl font-semibold">{formatINR(totalDebit)}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-xs uppercase tracking-wider text-neutral-500">
            Total credits
          </div>
          <div className="mt-1 text-xl font-semibold">{formatINR(totalCredit)}</div>
        </div>
        <div
          className={`rounded-lg border p-5 ${
            balanced
              ? 'border-success-500 bg-success-50'
              : 'border-danger-500 bg-danger-50'
          }`}
        >
          <div className="text-xs uppercase tracking-wider text-neutral-500">
            Balance check
          </div>
          <div
            className={`mt-1 text-xl font-semibold ${
              balanced ? 'text-success-700' : 'text-danger-700'
            }`}
          >
            {balanced ? 'Balanced ✓' : `Off by ${formatINR(Math.abs(totalDebit - totalCredit))}`}
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {[...byType.entries()].map(([type, groupRows]) => (
          <div
            key={type}
            className="overflow-hidden rounded-lg border border-neutral-200 bg-white"
          >
            <div className="bg-neutral-50 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-neutral-600">
              {type}
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Ledger</th>
                  <th className="px-4 py-2 font-medium text-right">Debit</th>
                  <th className="px-4 py-2 font-medium text-right">Credit</th>
                  <th className="px-4 py-2 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {groupRows.map((r) => (
                  <tr key={r.code}>
                    <td className="px-4 py-2 font-mono text-xs text-neutral-500">
                      {r.code}
                    </td>
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2 text-right">
                      {r.debit > 0 ? formatINR(r.debit) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {r.credit > 0 ? formatINR(r.credit) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {formatINR(Math.abs(r.balance))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
