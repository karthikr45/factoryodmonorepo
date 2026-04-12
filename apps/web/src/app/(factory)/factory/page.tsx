import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { apiCallServer } from '@/lib/api';
import { ACCESS_COOKIE, getCurrentUser } from '@/lib/auth';
import { formatINR } from '@/lib/utils';

interface DashboardData {
  ordersInProduction: number;
  pendingJobCards: number;
  pendingAttendanceApproval: number;
  unreadNotifications: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  outstandingReceivables: number;
}

async function fetchDashboard(): Promise<DashboardData> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  return apiCallServer<DashboardData>('/reports/dashboard', { accessToken: token });
}

export default async function FactoryDashboardPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'OWNER' && user.role !== 'MANAGER') redirect('/login');

  const data = await fetchDashboard().catch(() => null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-neutral-600">{user.organisation.name}</p>
        </div>
        <Link
          href="/factory/orders"
          className="rounded-md bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
        >
          + New order
        </Link>
      </div>

      {!data ? (
        <div className="mt-8 rounded-md border border-warning-500 bg-warning-50 p-4 text-warning-700">
          Could not load dashboard. Make sure the API is running at {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}.
        </div>
      ) : (
        <>
          {/* Action items — what needs your attention RIGHT NOW */}
          {(data.pendingAttendanceApproval > 0 || data.pendingJobCards > 0 || data.outstandingReceivables > 0) && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-danger-600">Needs your attention</h2>
              <div className="mt-3 space-y-2">
                {data.pendingAttendanceApproval > 0 && (
                  <Link href="/factory/attendance" className="flex items-center justify-between rounded-lg border border-warning-200 bg-warning-50 p-4 transition hover:bg-warning-100">
                    <div>
                      <div className="font-semibold text-warning-800">{data.pendingAttendanceApproval} attendance records pending approval</div>
                      <div className="text-sm text-warning-700">Agency marked attendance. Review and approve to post wages.</div>
                    </div>
                    <span className="text-sm font-semibold text-warning-700">Approve &rarr;</span>
                  </Link>
                )}
                {data.pendingJobCards > 0 && (
                  <Link href="/factory/production" className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 p-4 transition hover:bg-brand-100">
                    <div>
                      <div className="font-semibold text-brand-800">{data.pendingJobCards} job cards waiting</div>
                      <div className="text-sm text-brand-700">Pending or in-progress across departments.</div>
                    </div>
                    <span className="text-sm font-semibold text-brand-700">View &rarr;</span>
                  </Link>
                )}
                {data.outstandingReceivables > 0 && (
                  <Link href="/factory/invoices" className="flex items-center justify-between rounded-lg border border-accent-200 bg-accent-50 p-4 transition hover:bg-accent-100">
                    <div>
                      <div className="font-semibold text-accent-800">{formatINR(data.outstandingReceivables)} outstanding</div>
                      <div className="text-sm text-accent-700">Customer payments pending. Send reminders.</div>
                    </div>
                    <span className="text-sm font-semibold text-accent-700">Collect &rarr;</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Key numbers */}
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Link href="/factory/orders?status=IN_PRODUCTION" className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-brand-200">
              <div className="text-xs uppercase tracking-wider text-neutral-500">In production</div>
              <div className="mt-2 text-3xl font-semibold text-brand-900">{data.ordersInProduction}</div>
              <div className="mt-1 text-xs text-neutral-500">active orders</div>
            </Link>
            <Link href="/factory/production" className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-brand-200">
              <div className="text-xs uppercase tracking-wider text-neutral-500">Job cards</div>
              <div className="mt-2 text-3xl font-semibold text-brand-900">{data.pendingJobCards}</div>
              <div className="mt-1 text-xs text-neutral-500">pending / in progress</div>
            </Link>
            <Link href="/factory/finance" className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-brand-200">
              <div className="text-xs uppercase tracking-wider text-neutral-500">Revenue (month)</div>
              <div className="mt-2 text-2xl font-semibold text-success-700">{formatINR(data.monthlyRevenue)}</div>
              <div className="mt-1 text-xs text-neutral-500">auto-tracked</div>
            </Link>
            <Link href="/factory/reports" className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-brand-200">
              <div className="text-xs uppercase tracking-wider text-neutral-500">Expenses (month)</div>
              <div className="mt-2 text-2xl font-semibold text-danger-700">{formatINR(data.monthlyExpenses)}</div>
              <div className="mt-1 text-xs text-neutral-500">wages + materials</div>
            </Link>
          </div>

          {/* Quick workflows */}
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Workflows</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { href: '/factory/quotations', title: 'Send a quotation', desc: 'Customer asks for pricing? Create and send a quote.' },
                { href: '/factory/orders', title: 'Manage orders', desc: 'Track from enquiry to delivery. Auto-generates job cards.' },
                { href: '/factory/procurement', title: 'Purchase material', desc: 'Create POs. Received goods auto-update inventory.' },
                { href: '/factory/inventory', title: 'Check stock', desc: 'Low stock alerts. Track every movement in/out.' },
                { href: '/factory/employees', title: 'View all employees', desc: 'Direct staff + contract workers in one place.' },
                { href: '/factory/finance', title: 'Books & accounts', desc: 'Auto-posted journal. Trial balance. P&L.' },
              ].map((w) => (
                <Link key={w.href} href={w.href} className="rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-sm">
                  <div className="font-semibold text-brand-900">{w.title}</div>
                  <div className="mt-1 text-sm text-neutral-600">{w.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
