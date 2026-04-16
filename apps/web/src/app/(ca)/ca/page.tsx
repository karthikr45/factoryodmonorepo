import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { apiCallServer } from '@/lib/api';
import { ACCESS_COOKIE, getCurrentUser } from '@/lib/auth';
import { formatINR } from '@/lib/utils';

interface Client {
  orgId: string;
  orgName: string;
  gstin: string | null;
  sinceDate: string | null;
  openInvoices: number;
  overdueInvoices: number;
  pendingGstReturns: number;
  last30dRevenue: number;
}

async function fetchClients(): Promise<Client[]> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  return apiCallServer<Client[]>('/relationships/ca/clients', { accessToken: token });
}

export default async function CaDashboardPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'CA') redirect('/login');

  const clients = await fetchClients().catch(() => [] as Client[]);

  const totals = clients.reduce(
    (acc, c) => ({
      open: acc.open + c.openInvoices,
      overdue: acc.overdue + c.overdueInvoices,
      pending: acc.pending + c.pendingGstReturns,
      revenue: acc.revenue + c.last30dRevenue,
    }),
    { open: 0, overdue: 0, pending: 0, revenue: 0 },
  );

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Your factory clients</h1>
        <p className="mt-1 text-neutral-600">Live snapshot of every factory you&rsquo;re connected to.</p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Active clients" value={String(clients.length)} />
        <Stat label="Open invoices" value={String(totals.open)} colour="text-brand-700" />
        <Stat label="Overdue" value={String(totals.overdue)} colour={totals.overdue ? 'text-danger-700' : 'text-success-700'} />
        <Stat label="Returns pending" value={String(totals.pending)} colour={totals.pending ? 'text-warning-700' : 'text-success-700'} />
      </div>

      {clients.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-brand-200 bg-white p-12 text-center">
          <div className="text-5xl">📒</div>
          <h2 className="mt-4 text-xl font-semibold text-brand-900">No factory clients yet</h2>
          <p className="mx-auto mt-2 max-w-md text-neutral-600">
            Ask the factory owner to send you a connection invite from their Settings → Partners page.
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">GSTIN</th>
                <th className="px-4 py-3 font-medium text-right">Open inv.</th>
                <th className="px-4 py-3 font-medium text-right">Overdue</th>
                <th className="px-4 py-3 font-medium text-right">Returns pending</th>
                <th className="px-4 py-3 font-medium text-right">Last 30d revenue</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {clients.map((c) => (
                <tr key={c.orgId} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-brand-900">{c.orgName}</div>
                    {c.sinceDate && (
                      <div className="text-xs text-neutral-500">since {new Date(c.sinceDate).toLocaleDateString('en-IN')}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600">{c.gstin ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{c.openInvoices}</td>
                  <td className={`px-4 py-3 text-right ${c.overdueInvoices ? 'font-semibold text-danger-700' : ''}`}>{c.overdueInvoices}</td>
                  <td className={`px-4 py-3 text-right ${c.pendingGstReturns ? 'font-semibold text-warning-700' : ''}`}>{c.pendingGstReturns}</td>
                  <td className="px-4 py-3 text-right">{formatINR(c.last30dRevenue * 100)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/ca/${c.orgId}`} className="rounded-md border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                      Open books
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <Link href="/ca/gst" className="text-sm font-semibold text-brand-700 hover:underline">
          Go to GST returns →
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, colour = 'text-brand-900' }: { label: string; value: string; colour?: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wider text-neutral-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${colour}`}>{value}</div>
    </div>
  );
}
