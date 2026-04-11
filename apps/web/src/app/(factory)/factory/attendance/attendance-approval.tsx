'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatIST } from '@/lib/utils';

interface Record {
  id: string;
  worker: { id: string; name: string };
  date: string;
  status: string;
  overtime: number;
  approvedAt: string | null;
  isDisputed: boolean;
  disputeNote: string | null;
}

interface Props {
  records: Record[];
}

export function AttendanceApproval({ records }: Props): JSX.Element {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [disputeFor, setDisputeFor] = useState<string | null>(null);
  const [disputeNote, setDisputeNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggle = (id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (): void => {
    if (selected.size === records.length) setSelected(new Set());
    else setSelected(new Set(records.map((r) => r.id)));
  };

  const approve = (): void => {
    if (selected.size === 0) return;
    start(async () => {
      try {
        const res = await apiCall<{ approved: number; totalWagesPaise: number }>({
          url: '/attendance/approve',
          method: 'POST',
          data: { attendanceIds: [...selected] },
        });
        setToast(`Approved ${res.approved} records — wages auto-posted`);
        setSelected(new Set());
        router.refresh();
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed to approve');
      }
    });
  };

  const dispute = (): void => {
    if (!disputeFor || disputeNote.length < 5) return;
    start(async () => {
      try {
        await apiCall({
          url: '/attendance/dispute',
          method: 'POST',
          data: { attendanceId: disputeFor, note: disputeNote },
        });
        setToast('Disputed — agency notified');
        setDisputeFor(null);
        setDisputeNote('');
        router.refresh();
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed to dispute');
      }
    });
  };

  return (
    <div className="mt-6">
      {records.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center text-neutral-500">
          Nothing pending approval.
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.size === records.length}
                onChange={toggleAll}
              />
              Select all ({records.length})
            </label>
            <Button onClick={approve} disabled={pending || selected.size === 0}>
              Approve {selected.size > 0 ? `${selected.size} records` : ''}
            </Button>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left">
                <tr>
                  <th className="px-3 py-2 w-10"></th>
                  <th className="px-3 py-2 font-medium">Worker</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">OT (hrs)</th>
                  <th className="px-3 py-2 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {records.map((r) => (
                  <tr key={r.id} className={selected.has(r.id) ? 'bg-brand-50/40' : ''}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggle(r.id)}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">{r.worker.name}</td>
                    <td className="px-3 py-2">{formatIST(r.date).split(',')[0]}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{r.overtime}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setDisputeFor(r.id)}
                        className="text-xs text-danger-600 hover:underline"
                      >
                        Dispute
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {disputeFor ? (
        <div className="mt-4 rounded-lg border border-danger-200 bg-danger-50 p-4">
          <div className="text-sm font-semibold text-danger-700">Raise a dispute</div>
          <textarea
            rows={2}
            value={disputeNote}
            onChange={(e) => setDisputeNote(e.target.value)}
            placeholder="Describe what's wrong (minimum 5 characters)"
            className="mt-2 w-full rounded border border-danger-200 px-2 py-1 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <Button variant="danger" onClick={dispute} disabled={pending}>
              Submit dispute
            </Button>
            <Button variant="outline" onClick={() => setDisputeFor(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="mt-4 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
