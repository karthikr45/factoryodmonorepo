'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatINR } from '@/lib/utils';

interface PayrollRow {
  id: string;
  worker: { id: string; name: string };
  daysPresent: number;
  daysAbsent: number;
  overtimeHours: number;
  basicAmount: number;
  epfDeduction: number;
  esicDeduction: number;
  netAmount: number;
  status: string;
}

export default function PayrollPage(): JSX.Element {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const { data: payroll, isLoading } = useQuery<PayrollRow[]>({
    queryKey: ['payroll', month, year],
    queryFn: () =>
      apiCall<PayrollRow[]>({ url: `/workers/payroll?month=${month}&year=${year}&as=agency` }),
  });

  const generate = (): void => {
    start(async () => {
      try {
        const res = await apiCall<{ created: number; skipped: number }>({
          url: '/workers/payroll/generate', method: 'POST',
          data: { month, year },
        });
        setToast(`Generated ${res.created} payroll rows (${res.skipped} skipped)`);
        qc.invalidateQueries({ queryKey: ['payroll'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  const markPaid = (id: string): void => {
    start(async () => {
      try {
        await apiCall({ url: `/workers/payroll/${id}/pay`, method: 'POST' });
        setToast('Marked as paid - journal entry posted');
        qc.invalidateQueries({ queryKey: ['payroll'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  const totalNet = payroll?.reduce((a, r) => a + r.netAmount, 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Payroll</h1>
        <Button onClick={generate} disabled={pending}>
          {pending ? 'Generating...' : 'Generate payroll'}
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <label className="text-sm font-medium text-neutral-700">Month</label>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i).toLocaleString('en-IN', { month: 'long' })}
            </option>
          ))}
        </select>
        <label className="text-sm font-medium text-neutral-700">Year</label>
        <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="w-24 rounded-md border border-neutral-300 px-3 py-1.5 text-sm" />
      </div>

      {toast && <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">{toast}</div>}

      {totalNet > 0 && (
        <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-4">
          <span className="text-sm font-medium text-brand-800">Total net payable: </span>
          <span className="text-lg font-bold text-brand-900">{formatINR(totalNet)}</span>
        </div>
      )}

      {isLoading ? (
        <div className="mt-12 text-center text-neutral-500">Loading...</div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left"><tr>
              <th className="px-4 py-3 font-medium">Worker</th>
              <th className="px-4 py-3 font-medium text-center">Days present</th>
              <th className="px-4 py-3 font-medium text-center">OT hrs</th>
              <th className="px-4 py-3 font-medium text-right">Basic</th>
              <th className="px-4 py-3 font-medium text-right">EPF</th>
              <th className="px-4 py-3 font-medium text-right">ESIC</th>
              <th className="px-4 py-3 font-medium text-right">Net</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {(payroll ?? []).length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-neutral-500">
                  No payroll data. Mark and approve attendance first, then generate payroll.
                </td></tr>
              ) : (payroll ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.worker.name}</td>
                  <td className="px-4 py-3 text-center">{r.daysPresent}</td>
                  <td className="px-4 py-3 text-center">{r.overtimeHours}</td>
                  <td className="px-4 py-3 text-right">{formatINR(r.basicAmount)}</td>
                  <td className="px-4 py-3 text-right text-neutral-500">{formatINR(r.epfDeduction)}</td>
                  <td className="px-4 py-3 text-right text-neutral-500">{formatINR(r.esicDeduction)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatINR(r.netAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.status === 'PAID' ? 'bg-success-50 text-success-700'
                        : r.status === 'APPROVED' ? 'bg-brand-100 text-brand-800'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/workers/payroll/${r.id}/slip.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Slip
                      </a>
                      {r.status !== 'PAID' && (
                        <Button size="sm" onClick={() => markPaid(r.id)} disabled={pending}>Pay</Button>
                      )}
                    </div>
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
