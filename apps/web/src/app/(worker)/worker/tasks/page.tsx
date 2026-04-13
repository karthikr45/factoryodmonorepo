'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

interface Task {
  id: string;
  status: string;
  order: { id: string; orderNumber: string; productName: string; quantity: number; unit: string };
  department: { id: string; name: string; sequence: number };
  startedAt: string | null;
  completedAt: string | null;
  assignedTo: string | null;
}

export default function WorkerTasksPage(): JSX.Element {
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['my-tasks'],
    queryFn: () => apiCall<Task[]>({ url: '/production/job-cards/mine' }),
  });

  const updateStatus = (id: string, status: string): void => {
    start(async () => {
      try {
        await apiCall({ url: `/production/job-cards/${id}/status`, method: 'POST', data: { status } });
        setToast(status === 'IN_PROGRESS' ? 'Started working' : 'Marked complete');
        qc.invalidateQueries({ queryKey: ['my-tasks'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  const pending_tasks = (tasks ?? []).filter((t) => t.status !== 'COMPLETED');
  const completed_today = (tasks ?? []).filter((t) => t.status === 'COMPLETED').slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">My tasks</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Job cards assigned to you or pending in your department
        </p>
      </div>

      {toast && <div className="rounded-md bg-brand-50 px-4 py-3 text-sm text-brand-800">{toast}</div>}

      {isLoading ? (
        <div className="py-12 text-center text-neutral-500">Loading...</div>
      ) : pending_tasks.length === 0 && completed_today.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
          <div className="text-4xl">🎉</div>
          <div className="mt-3 text-lg font-semibold text-brand-900">All caught up!</div>
          <div className="mt-1 text-sm text-neutral-600">No tasks waiting for you right now.</div>
        </div>
      ) : (
        <>
          {pending_tasks.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {pending_tasks.length} waiting
              </div>
              {pending_tasks.map((t) => (
                <div key={t.id} className={`rounded-xl border p-4 ${
                  t.status === 'IN_PROGRESS' ? 'border-warning-300 bg-warning-50'
                    : 'border-neutral-200 bg-white'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                          Stage {t.department.sequence} · {t.department.name}
                        </span>
                      </div>
                      <div className="mt-2 text-lg font-semibold text-brand-900">
                        {t.order.orderNumber}
                      </div>
                      <div className="text-sm text-neutral-700">
                        {t.order.productName} — {t.order.quantity} {t.order.unit}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    {t.status === 'PENDING' && (
                      <Button
                        onClick={() => updateStatus(t.id, 'IN_PROGRESS')}
                        disabled={pending}
                        className="w-full py-3 text-base"
                      >
                        Start working
                      </Button>
                    )}
                    {t.status === 'IN_PROGRESS' && (
                      <Button
                        onClick={() => updateStatus(t.id, 'COMPLETED')}
                        disabled={pending}
                        className="w-full bg-success-600 py-3 text-base hover:bg-success-700"
                      >
                        ✓ Mark as complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {completed_today.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-success-700">
                Recently completed
              </div>
              {completed_today.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm">
                  <div>
                    <span className="font-mono text-xs text-neutral-500">{t.order.orderNumber}</span>{' '}
                    <span className="text-neutral-700">{t.department.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-success-700">✓ Done</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
