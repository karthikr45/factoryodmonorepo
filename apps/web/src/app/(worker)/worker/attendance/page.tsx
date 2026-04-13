'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { apiCall } from '@/lib/api';

interface History {
  records: Array<{
    date: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    totalHours: number | null;
    isLate: boolean;
  }>;
  summary: { daysPresent: number; totalHours: number; lateCount: number };
}

function formatTime(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
}

export default function WorkerAttendancePage(): JSX.Element {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useQuery<History>({
    queryKey: ['attendance-history', month, year],
    queryFn: () => apiCall<History>({ url: `/check-in/me/history?month=${month}&year=${year}` }),
  });

  const monthName = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const prevMonth = (): void => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = (): void => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">My attendance</h1>
        <p className="mt-1 text-sm text-neutral-600">Your check-in history and monthly totals</p>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4">
        <button onClick={prevMonth} className="rounded-md px-3 py-1 text-xl text-neutral-700 hover:bg-neutral-100">
          ‹
        </button>
        <div className="text-lg font-semibold text-brand-900">{monthName}</div>
        <button onClick={nextMonth} disabled={isCurrentMonth}
          className="rounded-md px-3 py-1 text-xl text-neutral-700 hover:bg-neutral-100 disabled:opacity-30">
          ›
        </button>
      </div>

      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-success-200 bg-success-50 p-4 text-center">
            <div className="text-3xl font-bold text-success-700">{data.summary.daysPresent}</div>
            <div className="text-xs text-success-700">Days present</div>
          </div>
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-center">
            <div className="text-3xl font-bold text-brand-900">{data.summary.totalHours.toFixed(0)}</div>
            <div className="text-xs text-brand-700">Hours worked</div>
          </div>
          <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-center">
            <div className="text-3xl font-bold text-warning-700">{data.summary.lateCount}</div>
            <div className="text-xs text-warning-700">Late arrivals</div>
          </div>
        </div>
      )}

      {/* Records */}
      {isLoading ? (
        <div className="py-12 text-center text-neutral-500">Loading...</div>
      ) : (data?.records ?? []).length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
          <div className="text-lg font-semibold text-neutral-600">No attendance records</div>
          <div className="mt-1 text-sm text-neutral-500">
            {isCurrentMonth ? "Check in from the home screen to start tracking" : "You weren't checked in during this month"}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.records ?? []).map((r) => (
            <div key={r.date} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4">
              <div>
                <div className="font-semibold text-brand-900">{formatDate(r.date)}</div>
                <div className="mt-0.5 text-sm text-neutral-600">
                  {formatTime(r.checkInTime)} → {formatTime(r.checkOutTime)}
                </div>
                {r.isLate && <div className="mt-1 text-xs font-semibold text-danger-600">Late arrival</div>}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-brand-900">{r.totalHours?.toFixed(1) ?? '—'}</div>
                <div className="text-xs text-neutral-500">hours</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
