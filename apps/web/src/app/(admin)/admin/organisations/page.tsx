'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatIST } from '@/lib/utils';

interface Org {
  id: string; name: string; type: string; plan: string;
  isActive: boolean; gstin: string | null;
  userCount: number; createdAt: string;
}

export default function AdminOrgsPage(): JSX.Element {
  const qc = useQueryClient();
  const [pending, start] = useTransition();

  const { data: orgs } = useQuery<Org[]>({
    queryKey: ['admin-orgs'],
    queryFn: () => apiCall<Org[]>({ url: '/super-admin/organisations' }),
  });

  const toggle = (id: string): void => {
    start(async () => {
      await apiCall({ url: `/super-admin/organisations/${id}/toggle-active`, method: 'POST' });
      qc.invalidateQueries({ queryKey: ['admin-orgs'] });
    });
  };

  const setPlan = (id: string, plan: string): void => {
    start(async () => {
      await apiCall({ url: `/super-admin/organisations/${id}/plan`, method: 'POST', data: { plan } });
      qc.invalidateQueries({ queryKey: ['admin-orgs'] });
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">All Organisations</h1>
      <p className="mt-1 text-neutral-600">Manage every business on the FactoryOS platform</p>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">GSTIN</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Users</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(orgs ?? []).map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-medium">{o.name}</td>
                <td className="px-4 py-3">{o.type}</td>
                <td className="px-4 py-3 font-mono text-xs">{o.gstin ?? '—'}</td>
                <td className="px-4 py-3">
                  <select value={o.plan} onChange={(e) => setPlan(o.id, e.target.value)}
                    disabled={pending}
                    className="rounded border border-neutral-200 px-2 py-1 text-xs">
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                  </select>
                </td>
                <td className="px-4 py-3">{o.userCount}</td>
                <td className="px-4 py-3 text-neutral-500">{formatIST(o.createdAt).split(',')[0]}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    o.isActive ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-600'
                  }`}>{o.isActive ? 'Active' : 'Disabled'}</span>
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant={o.isActive ? 'outline' : 'default'} onClick={() => toggle(o.id)} disabled={pending}>
                    {o.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
