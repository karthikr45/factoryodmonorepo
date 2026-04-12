'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatIST } from '@/lib/utils';

interface JobCard {
  id: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  department: { id: string; name: string; sequence: number };
  order: { id: string; orderNumber: string; productName: string };
  assignedTo: string | null;
}

interface Department {
  id: string;
  name: string;
  sequence: number;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  IN_PROGRESS: 'bg-warning-50 text-warning-700 border-warning-200',
  COMPLETED: 'bg-success-50 text-success-700 border-success-200',
  ON_HOLD: 'bg-danger-50 text-danger-700 border-danger-200',
};

export default function ProductionPage(): JSX.Element {
  const qc = useQueryClient();
  const [filterDept, setFilterDept] = useState('');

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => apiCall<Department[]>({ url: '/production/departments' }),
  });

  const { data: jobCards, isLoading } = useQuery<JobCard[]>({
    queryKey: ['job-cards', filterDept],
    queryFn: () =>
      apiCall<JobCard[]>({
        url: `/production/job-cards${filterDept ? `?departmentId=${filterDept}` : ''}`,
      }),
  });

  const updateStatus = async (id: string, status: string): Promise<void> => {
    await apiCall({
      url: `/production/job-cards/${id}/status`,
      method: 'POST',
      data: { status },
    });
    qc.invalidateQueries({ queryKey: ['job-cards'] });
  };

  const grouped = new Map<string, JobCard[]>();
  for (const jc of jobCards ?? []) {
    const key = jc.department.name;
    const list = grouped.get(key) ?? [];
    list.push(jc);
    grouped.set(key, list);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Production</h1>
          <p className="mt-1 text-neutral-600">Job cards across departments</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setFilterDept('')}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            !filterDept ? 'border-brand-700 bg-brand-700 text-white' : 'border-neutral-200'
          }`}
        >
          All
        </button>
        {(departments ?? []).map((d) => (
          <button
            key={d.id}
            onClick={() => setFilterDept(d.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              filterDept === d.id ? 'border-brand-700 bg-brand-700 text-white' : 'border-neutral-200'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-12 text-center text-neutral-500">Loading...</div>
      ) : (jobCards ?? []).length === 0 ? (
        <div className="mt-12 rounded-lg border border-neutral-200 bg-white p-12 text-center text-neutral-500">
          No job cards yet. Create an order and generate job cards from the order detail page.
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {[...grouped.entries()].map(([deptName, cards]) => (
            <div key={deptName}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                {deptName}
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((jc) => (
                  <div key={jc.id} className={`rounded-lg border p-4 ${STATUS_COLOR[jc.status] ?? ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{jc.order.orderNumber}</div>
                        <div className="text-sm opacity-80">{jc.order.productName}</div>
                      </div>
                      <span className="rounded-full bg-white/50 px-2 py-0.5 text-xs font-semibold">
                        {jc.status.replace('_', ' ')}
                      </span>
                    </div>
                    {jc.startedAt && (
                      <div className="mt-2 text-xs opacity-70">
                        Started: {formatIST(jc.startedAt)}
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      {jc.status === 'PENDING' && (
                        <Button size="sm" onClick={() => updateStatus(jc.id, 'IN_PROGRESS')}>
                          Start
                        </Button>
                      )}
                      {jc.status === 'IN_PROGRESS' && (
                        <Button size="sm" onClick={() => updateStatus(jc.id, 'COMPLETED')}>
                          Complete
                        </Button>
                      )}
                      {jc.status === 'IN_PROGRESS' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(jc.id, 'ON_HOLD')}>
                          Hold
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
