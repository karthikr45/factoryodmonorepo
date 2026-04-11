'use client';

import { useState, useTransition } from 'react';

import { AttendanceStatus } from '@repo/types';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

interface Deployment {
  id: string;
  worker: { id: string; name: string; skill: string };
  factoryOrgId: string;
  startDate: string;
}

interface Props {
  deployments: Deployment[];
}

type Marks = Record<string, { status: AttendanceStatus; overtime: number }>;

export function AttendanceGrid({ deployments }: Props): JSX.Element {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Marks>({});
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const setStatus = (workerId: string, status: AttendanceStatus): void => {
    setMarks((m) => ({
      ...m,
      [workerId]: { status, overtime: m[workerId]?.overtime ?? 0 },
    }));
  };

  const setOvertime = (workerId: string, overtime: number): void => {
    setMarks((m) => ({
      ...m,
      [workerId]: { status: m[workerId]?.status ?? AttendanceStatus.PRESENT, overtime },
    }));
  };

  const submit = (): void => {
    const entries = Object.entries(marks);
    if (entries.length === 0) {
      setToast('Mark at least one worker first');
      return;
    }
    start(async () => {
      try {
        for (const [workerId, mark] of entries) {
          await apiCall({
            url: '/attendance',
            method: 'POST',
            data: {
              workerId,
              date: new Date(date).toISOString(),
              status: mark.status,
              overtime: mark.overtime,
            },
          });
        }
        setToast(`Marked ${entries.length} workers for ${date}`);
        setMarks({});
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed to mark');
      }
    });
  };

  return (
    <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-neutral-700">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>

      {deployments.length === 0 ? (
        <p className="mt-6 text-neutral-500">
          No active deployments. Add workers and deploy them to a factory first.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Worker</th>
                <th className="px-3 py-2 font-medium">Skill</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Overtime (hrs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {deployments.map((d) => {
                const mark = marks[d.worker.id];
                return (
                  <tr key={d.id}>
                    <td className="px-3 py-2 font-medium">{d.worker.name}</td>
                    <td className="px-3 py-2 text-neutral-600">{d.worker.skill}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {(
                          [
                            ['P', AttendanceStatus.PRESENT],
                            ['A', AttendanceStatus.ABSENT],
                            ['½', AttendanceStatus.HALF_DAY],
                            ['H', AttendanceStatus.HOLIDAY],
                          ] as const
                        ).map(([label, s]) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(d.worker.id, s)}
                            className={`h-8 w-8 rounded border text-xs font-semibold ${
                              mark?.status === s
                                ? 'border-brand-700 bg-brand-700 text-white'
                                : 'border-neutral-200 hover:bg-neutral-50'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={mark?.overtime ?? 0}
                        onChange={(e) =>
                          setOvertime(d.worker.id, Number(e.target.value))
                        }
                        className="w-20 rounded border border-neutral-300 px-2 py-1"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={submit} disabled={pending || deployments.length === 0}>
          {pending ? 'Submitting...' : `Submit attendance`}
        </Button>
        {toast ? <span className="text-sm text-neutral-600">{toast}</span> : null}
      </div>
    </div>
  );
}
