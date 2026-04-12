'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatINR } from '@/lib/utils';

interface Worker {
  id: string;
  name: string;
  phone: string;
  skill: string;
  dailyRate: number;
  isActive: boolean;
  aadhaarLast4: string;
}

export default function WorkersPage(): JSX.Element {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [aadhaar, setAadhaar] = useState('');
  const [skill, setSkill] = useState('');
  const [rate, setRate] = useState('');

  const { data: workers, isLoading } = useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: () => apiCall<Worker[]>({ url: '/workers' }),
  });

  const createWorker = (): void => {
    start(async () => {
      try {
        await apiCall({
          url: '/workers', method: 'POST',
          data: { name, phone, aadhaarLast4: aadhaar, skill, dailyRate: Math.round(Number(rate) * 100) },
        });
        setToast('Worker added');
        setShowForm(false);
        setName(''); setPhone('+91'); setAadhaar(''); setSkill(''); setRate('');
        qc.invalidateQueries({ queryKey: ['workers'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Workers</h1>
          <p className="mt-1 text-neutral-600">{workers?.length ?? 0} registered workers</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add worker</Button>
      </div>

      {toast && (
        <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">{toast}</div>
      )}

      {showForm && (
        <div className="mt-6 max-w-lg rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-brand-900">Register new worker</h2>
          <div className="mt-4 space-y-4">
            <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <input placeholder="+919876543210" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <input placeholder="Last 4 digits of Aadhaar" maxLength={4} value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <input placeholder="Skill (e.g. Welding, Assembly)" value={skill} onChange={(e) => setSkill(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <input placeholder="Daily rate (Rs)" type="number" value={rate} onChange={(e) => setRate(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <div className="flex gap-2">
              <Button onClick={createWorker} disabled={pending || !name || !phone || !aadhaar || !skill || !rate}>
                {pending ? 'Saving...' : 'Register'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="mt-12 text-center text-neutral-500">Loading...</div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left"><tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Skill</th>
              <th className="px-4 py-3 font-medium">Daily rate</th>
              <th className="px-4 py-3 font-medium">Aadhaar (last 4)</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {(workers ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-500">No workers registered yet</td></tr>
              ) : (workers ?? []).map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-3 font-medium">{w.name}</td>
                  <td className="px-4 py-3">{w.phone}</td>
                  <td className="px-4 py-3">{w.skill}</td>
                  <td className="px-4 py-3">{formatINR(w.dailyRate)}</td>
                  <td className="px-4 py-3 font-mono">****{w.aadhaarLast4}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${w.isActive ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-600'}`}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
