'use client';

import { useQuery } from '@tanstack/react-query';

import { apiCall } from '@/lib/api';
import { formatINR } from '@/lib/utils';

interface Stats {
  totalOrgs: number; activeOrgs: number; pendingOrgs: number;
  byType: { FACTORY: number; AGENCY: number; CA_FIRM: number };
  totalUsers: number; totalOrders: number;
  totalGMV: number; relationships: number;
}

export default function AdminDashboardPage(): JSX.Element {
  const { data } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: () => apiCall<Stats>({ url: '/super-admin/stats' }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Platform overview</h1>
      <p className="mt-1 text-neutral-600">Real-time metrics across every organisation on FactoryOS</p>

      {!data ? (
        <div className="mt-8 text-neutral-500">Loading...</div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="text-xs uppercase tracking-wider text-neutral-500">Total organisations</div>
              <div className="mt-1 text-3xl font-semibold text-brand-900">{data.totalOrgs}</div>
              <div className="mt-1 text-xs text-success-700">{data.activeOrgs} active</div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="text-xs uppercase tracking-wider text-neutral-500">Total users</div>
              <div className="mt-1 text-3xl font-semibold text-brand-900">{data.totalUsers}</div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="text-xs uppercase tracking-wider text-neutral-500">Orders processed</div>
              <div className="mt-1 text-3xl font-semibold text-brand-900">{data.totalOrders}</div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="text-xs uppercase tracking-wider text-neutral-500">GMV (dispatched)</div>
              <div className="mt-1 text-2xl font-semibold text-success-700">{formatINR(data.totalGMV)}</div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">By organisation type</h2>
              <div className="mt-4 space-y-3">
                {Object.entries(data.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="font-medium">{type}</span>
                    <span className="text-lg font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Network effect</h2>
              <div className="mt-4">
                <div className="text-3xl font-semibold text-brand-900">{data.relationships}</div>
                <div className="mt-1 text-sm text-neutral-600">active cross-organisation relationships</div>
                <div className="mt-4 text-xs text-neutral-500">
                  Factories connected to CAs, factories with agency partners, etc.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
