'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatIST } from '@/lib/utils';

interface Submission {
  id: string; name: string; email: string; phone: string | null;
  company: string | null; subject: string | null; message: string;
  status: string; createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-warning-100 text-warning-700',
  IN_PROGRESS: 'bg-brand-100 text-brand-700',
  RESPONDED: 'bg-success-100 text-success-700',
  CLOSED: 'bg-neutral-200 text-neutral-700',
  SPAM: 'bg-danger-100 text-danger-700',
};

export default function ContactSubmissionsPage(): JSX.Element {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('');
  const [pending, start] = useTransition();

  const { data } = useQuery<Submission[]>({
    queryKey: ['contact-submissions', filter],
    queryFn: () => apiCall<Submission[]>({ url: `/content/contact/all${filter ? `?status=${filter}` : ''}` }),
  });

  const updateStatus = (id: string, status: string): void => {
    start(async () => {
      await apiCall({ url: `/content/contact/${id}/status`, method: 'PUT', data: { status } });
      qc.invalidateQueries({ queryKey: ['contact-submissions'] });
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Contact submissions</h1>
      <p className="mt-1 text-neutral-600">Inquiries from the public contact form.</p>

      <div className="mt-4 flex gap-2">
        {['', 'NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED', 'SPAM'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              filter === s ? 'border-brand-700 bg-brand-700 text-white' : 'border-neutral-200'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {(data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center text-neutral-500">
            No submissions {filter ? `with status ${filter}` : 'yet'}
          </div>
        ) : (data ?? []).map((s) => (
          <div key={s.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[s.status] ?? ''}`}>
                    {s.status}
                  </span>
                  <span className="text-xs text-neutral-500">{formatIST(s.createdAt)}</span>
                </div>
                <div className="mt-2">
                  <div className="font-semibold text-brand-900">{s.name}</div>
                  <div className="text-sm text-neutral-600">
                    <a href={`mailto:${s.email}`} className="hover:underline">{s.email}</a>
                    {s.phone && <> · <a href={`tel:${s.phone}`} className="hover:underline">{s.phone}</a></>}
                    {s.company && <> · {s.company}</>}
                  </div>
                </div>
                {s.subject && <div className="mt-2 font-medium text-brand-800">{s.subject}</div>}
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{s.message}</p>
              </div>
              <select value={s.status} onChange={(e) => updateStatus(s.id, e.target.value)} disabled={pending}
                className="rounded-md border border-neutral-300 px-2 py-1 text-xs">
                <option value="NEW">New</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESPONDED">Responded</option>
                <option value="CLOSED">Closed</option>
                <option value="SPAM">Spam</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
