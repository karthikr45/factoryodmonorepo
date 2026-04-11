import { cookies } from 'next/headers';
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

  const cards = data
    ? [
        { label: 'Orders in production', value: data.ordersInProduction.toString() },
        { label: 'Pending job cards', value: data.pendingJobCards.toString() },
        {
          label: 'Attendance awaiting approval',
          value: data.pendingAttendanceApproval.toString(),
        },
        { label: 'Revenue this month', value: formatINR(data.monthlyRevenue) },
        { label: 'Expenses this month', value: formatINR(data.monthlyExpenses) },
        { label: 'Outstanding receivables', value: formatINR(data.outstandingReceivables) },
      ]
    : [];

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-neutral-600">{user.organisation.name}</p>
        </div>
      </div>

      {!data ? (
        <div className="mt-8 rounded-md border border-warning-500 bg-warning-50 p-4 text-warning-700">
          Could not load dashboard. Make sure the API is running.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="text-xs uppercase tracking-wider text-neutral-500">
                {c.label}
              </div>
              <div className="mt-2 text-2xl font-semibold text-brand-900">{c.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
