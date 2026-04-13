'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  description: string | null;
  industry: string;
  icon: string | null;
  isDefault: boolean;
  stageCount: number;
  createdAt: string;
}

export default function WorkflowsListPage(): JSX.Element {
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const { data, isLoading } = useQuery<Template[]>({
    queryKey: ['workflow-templates'],
    queryFn: () => apiCall<Template[]>({ url: '/workflows' }),
  });

  const seedTemplates = (): void => {
    start(async () => {
      const res = await apiCall<{ created: number }>({
        url: '/workflows/seed-system-templates', method: 'POST',
      });
      setToast(`Added ${res.created} industry templates`);
      qc.invalidateQueries({ queryKey: ['workflow-templates'] });
    });
  };

  const setDefault = (id: string): void => {
    start(async () => {
      await apiCall({ url: `/workflows/${id}/set-default`, method: 'POST' });
      setToast('Default workflow updated');
      qc.invalidateQueries({ queryKey: ['workflow-templates'] });
    });
  };

  const remove = (id: string): void => {
    if (!confirm('Delete this workflow? Orders already using it will keep their snapshot.')) return;
    start(async () => {
      try {
        await apiCall({ url: `/workflows/${id}`, method: 'DELETE' });
        setToast('Workflow deleted');
        qc.invalidateQueries({ queryKey: ['workflow-templates'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Workflows</h1>
          <p className="mt-1 text-neutral-600">
            Design how orders move through your factory — stages, QC gates, outsourcing, and SLAs
          </p>
        </div>
        <div className="flex gap-2">
          {(!data || data.length === 0) && (
            <Button variant="outline" onClick={seedTemplates} disabled={pending}>
              Load industry templates
            </Button>
          )}
          <Link href="/factory/workflows/new" className="inline-flex items-center rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            + New workflow
          </Link>
        </div>
      </div>

      {toast && <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">{toast}</div>}

      {isLoading ? (
        <div className="mt-12 text-center text-neutral-500">Loading...</div>
      ) : (data ?? []).length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-brand-200 bg-white p-12 text-center">
          <div className="text-5xl">⚙️</div>
          <h2 className="mt-4 text-xl font-semibold text-brand-900">Design your first workflow</h2>
          <p className="mx-auto mt-2 max-w-md text-neutral-600">
            A workflow defines how orders move through your factory. You can start with a pre-made
            industry template and customize it, or build from scratch.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={seedTemplates} disabled={pending}>
              {pending ? 'Loading...' : 'Start with industry templates'}
            </Button>
            <Link href="/factory/workflows/new">
              <Button variant="outline">Build from scratch</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((t) => (
            <div
              key={t.id}
              className={`group relative rounded-2xl border bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-lg ${
                t.isDefault ? 'border-brand-400 shadow-lg shadow-brand-600/10' : 'border-neutral-200 hover:border-brand-300'
              }`}
            >
              {t.isDefault && (
                <div className="absolute -top-2 -right-2 rounded-full bg-gradient-to-r from-brand-600 to-highlight-400 px-2 py-0.5 text-xs font-semibold text-white shadow-lg">
                  Default
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="text-3xl">{t.icon ?? '⚙️'}</div>
                <div className="flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    {t.industry.replace('_', ' ')}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-brand-900">{t.name}</h3>
                </div>
              </div>
              {t.description && (
                <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{t.description}</p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-neutral-500">{t.stageCount} stages</span>
                <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
                  <Link href={`/factory/workflows/${t.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
                    Edit
                  </Link>
                  {!t.isDefault && (
                    <>
                      <button onClick={() => setDefault(t.id)} className="text-sm font-semibold text-accent-700 hover:underline">
                        Set default
                      </button>
                      <button onClick={() => remove(t.id)} className="text-sm font-semibold text-danger-600 hover:underline">
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
