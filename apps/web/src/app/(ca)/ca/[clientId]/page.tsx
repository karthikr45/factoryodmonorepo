import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { apiCallServer } from '@/lib/api';
import { ACCESS_COOKIE, getCurrentUser } from '@/lib/auth';
import { formatINR } from '@/lib/utils';

interface TrialBalanceRow {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

interface PageProps { params: Promise<{ clientId: string }> }

async function fetchTb(clientId: string): Promise<TrialBalanceRow[]> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  return apiCallServer<TrialBalanceRow[]>(`/finance/client/${clientId}/trial-balance`, { accessToken: token });
}

export default async function CaClientPage({ params }: PageProps): Promise<JSX.Element> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'CA') redirect('/login');

  const { clientId } = await params;
  const rows = await fetchTb(clientId).catch(() => [] as TrialBalanceRow[]);

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
      <div className="mb-4">
        <Link href="/ca" className="text-sm text-brand-700 hover:underline">← All clients</Link>
      </div>
      <h1 className="text-2xl font-bold text-brand-900">Client books</h1>
      <p className="mt-1 text-neutral-600">Trial balance generated live from the journal.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Total debits" value={formatINR(totalDebit)} />
        <Stat label="Total credits" value={formatINR(totalCredit)} />
        <Stat
          label="Balance check"
          value={balanced ? 'Balanced ✓' : `Off by ${formatINR(Math.abs(totalDebit - totalCredit))}`}
          colour={balanced ? 'text-success-700' : 'text-danger-700'}
        />
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-brand-200 bg-white p-12 text-center text-neutral-500">
          No journal entries yet for this client.
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {[...byType.entries()].map(([type, groupRows]) => (
            <div key={type} className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <div className="bg-neutral-50 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-neutral-600">{type}</div>
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
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, colour = 'text-brand-900' }: { label: string; value: string; colour?: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wider text-neutral-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${colour}`}>{value}</div>
    </div>
  );
}
