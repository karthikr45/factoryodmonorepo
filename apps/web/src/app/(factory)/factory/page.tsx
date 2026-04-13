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

interface OrderSummary {
  id: string;
  orderNumber: string;
  productName: string;
  status: string;
  customer: { name: string };
  totalValue: number;
  deliveryDate: string;
}

async function fetchDashboard(token: string | undefined): Promise<DashboardData> {
  return apiCallServer<DashboardData>('/reports/dashboard', { accessToken: token });
}

async function fetchRecentOrders(token: string | undefined): Promise<OrderSummary[]> {
  const res = await apiCallServer<{ data: OrderSummary[] }>('/orders?pageSize=5', { accessToken: token });
  return res.data;
}

export default async function FactoryDashboardPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;

  const [data, recentOrders] = await Promise.all([
    fetchDashboard(token).catch(() => null),
    fetchRecentOrders(token).catch(() => [] as OrderSummary[]),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Greeting */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            {greeting}, {user.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-neutral-600">{user.organisation.name} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <Link
          href="/factory/orders/new"
          className="rounded-md bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
        >
          + New order
        </Link>
      </div>

      {!data ? (
        <div className="mt-8 rounded-md border border-warning-500 bg-warning-50 p-4 text-warning-700">
          Could not load dashboard. Make sure the API is running.
        </div>
      ) : (
        <>
          {/* Today's actions — THE most important section */}
          {(data.pendingAttendanceApproval > 0 || data.pendingJobCards > 0 || recentOrders.some((o) => o.status === 'ENQUIRY')) && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Your agenda today</h2>
              <div className="mt-3 space-y-2">
                {recentOrders.filter((o) => o.status === 'ENQUIRY').slice(0, 2).map((o) => (
                  <Link key={o.id} href={`/factory/orders/${o.id}`} className="flex items-center justify-between rounded-lg border border-accent-200 bg-accent-50 p-4 transition hover:bg-accent-100">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-accent-700">New enquiry</div>
                      <div className="mt-1 font-semibold text-accent-900">{o.customer.name} — {o.productName}</div>
                      <div className="text-sm text-accent-700">Send a quotation → convert to order</div>
                    </div>
                    <span className="text-sm font-semibold text-accent-700">Respond →</span>
                  </Link>
                ))}
                {data.pendingAttendanceApproval > 0 && (
                  <Link href="/factory/people/attendance" className="flex items-center justify-between rounded-lg border border-warning-200 bg-warning-50 p-4 transition hover:bg-warning-100">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-warning-700">Attendance</div>
                      <div className="mt-1 font-semibold text-warning-900">{data.pendingAttendanceApproval} records pending approval</div>
                      <div className="text-sm text-warning-700">Review and approve — wages will auto-post to your books</div>
                    </div>
                    <span className="text-sm font-semibold text-warning-700">Approve →</span>
                  </Link>
                )}
                {data.pendingJobCards > 0 && (
                  <Link href="/factory/orders" className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 p-4 transition hover:bg-brand-100">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-brand-700">Production</div>
                      <div className="mt-1 font-semibold text-brand-900">{data.pendingJobCards} job cards in progress</div>
                      <div className="text-sm text-brand-700">Click an order to see department-wise progress</div>
                    </div>
                    <span className="text-sm font-semibold text-brand-700">View orders →</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Money snapshot */}
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">This month</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Link href="/factory/money/finance" className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-brand-200">
                <div className="text-xs uppercase text-neutral-500">Revenue</div>
                <div className="mt-1 text-2xl font-semibold text-success-700">{formatINR(data.monthlyRevenue)}</div>
              </Link>
              <Link href="/factory/money/finance" className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-brand-200">
                <div className="text-xs uppercase text-neutral-500">Expenses</div>
                <div className="mt-1 text-2xl font-semibold text-danger-700">{formatINR(data.monthlyExpenses)}</div>
              </Link>
              <Link href="/factory/money/invoices" className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-brand-200">
                <div className="text-xs uppercase text-neutral-500">Receivables outstanding</div>
                <div className="mt-1 text-2xl font-semibold text-accent-600">{formatINR(data.outstandingReceivables)}</div>
              </Link>
            </div>
          </div>

          {/* Recent orders — jump back in */}
          {recentOrders.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Recent orders</h2>
                <Link href="/factory/orders" className="text-xs font-semibold text-brand-700 hover:underline">View all →</Link>
              </div>
              <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-neutral-100">
                    {recentOrders.slice(0, 5).map((o) => (
                      <tr key={o.id} className="transition hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <Link href={`/factory/orders/${o.id}`} className="font-mono font-semibold text-brand-700 hover:underline">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-neutral-700">{o.customer.name}</td>
                        <td className="px-4 py-3 text-neutral-600">{o.productName}</td>
                        <td className="px-4 py-3 text-right">{formatINR(o.totalValue)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                            {o.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
