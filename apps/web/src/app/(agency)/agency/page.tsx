'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { apiCall } from '@/lib/api';

interface Worker { id: string; name: string; skill: string; isActive: boolean; }
interface Deployment { id: string; worker: { id: string; name: string }; status: string; }

export default function AgencyDashboardPage(): JSX.Element {
  const { data: workers } = useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: () => apiCall<Worker[]>({ url: '/workers' }),
  });

  const { data: deployments } = useQuery<Deployment[]>({
    queryKey: ['deployments'],
    queryFn: () => apiCall<Deployment[]>({ url: '/workers/deployments?as=agency' }),
  });

  const activeWorkers = workers?.filter((w) => w.isActive).length ?? 0;
  const activeDeployments = deployments?.filter((d) => d.status === 'ACTIVE').length ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Agency Dashboard</h1>
      <p className="mt-1 text-neutral-600">Manage your workforce and deployments</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-xs uppercase tracking-wider text-neutral-500">Active workers</div>
          <div className="mt-1 text-3xl font-semibold text-brand-900">{activeWorkers}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-xs uppercase tracking-wider text-neutral-500">Active deployments</div>
          <div className="mt-1 text-3xl font-semibold text-brand-900">{activeDeployments}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-xs uppercase tracking-wider text-neutral-500">Total workers</div>
          <div className="mt-1 text-3xl font-semibold text-brand-900">{workers?.length ?? 0}</div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Quick actions</h2>
          <div className="mt-4 space-y-3">
            <Link href="/agency/workers" className="block rounded-lg border border-neutral-200 p-4 transition hover:border-brand-200 hover:bg-brand-50">
              <div className="font-semibold text-brand-900">Manage workers</div>
              <div className="text-sm text-neutral-600">Add, edit, or deploy workers to factories</div>
            </Link>
            <Link href="/agency/attendance" className="block rounded-lg border border-neutral-200 p-4 transition hover:border-brand-200 hover:bg-brand-50">
              <div className="font-semibold text-brand-900">Mark attendance</div>
              <div className="text-sm text-neutral-600">Daily attendance for deployed workers</div>
            </Link>
            <Link href="/agency/payroll" className="block rounded-lg border border-neutral-200 p-4 transition hover:border-brand-200 hover:bg-brand-50">
              <div className="font-semibold text-brand-900">Payroll</div>
              <div className="text-sm text-neutral-600">Generate and manage monthly payroll</div>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Active deployments</h2>
          {activeDeployments === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">No active deployments. Deploy workers from the workers page.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {deployments?.filter((d) => d.status === 'ACTIVE').slice(0, 8).map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded border border-neutral-100 px-3 py-2 text-sm">
                  <span className="font-medium">{d.worker.name}</span>
                  <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs text-success-700">Active</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
