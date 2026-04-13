'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { apiCall } from '@/lib/api';

interface Status {
  checkedIn: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalHours: number | null;
  isLate: boolean;
}

interface MonthSummary {
  summary: { daysPresent: number; totalHours: number; lateCount: number };
}

interface Task {
  id: string;
  status: string;
  order: { orderNumber: string; productName: string };
  department: { name: string };
}

export default function WorkerHomePage(): JSX.Element {
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const { data: status, isLoading } = useQuery<Status>({
    queryKey: ['check-in-status'],
    queryFn: () => apiCall<Status>({ url: '/check-in/me/status' }),
  });

  const now = new Date();
  const { data: monthData } = useQuery<MonthSummary>({
    queryKey: ['check-in-history', now.getMonth() + 1, now.getFullYear()],
    queryFn: () => apiCall<MonthSummary>({
      url: `/check-in/me/history?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
    }),
  });

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['my-tasks'],
    queryFn: () => apiCall<Task[]>({ url: '/production/job-cards/mine' }),
  });

  const checkIn = (): void => {
    start(async () => {
      try {
        // Try to get GPS; silently continue if denied
        const pos = await new Promise<GeolocationPosition | null>((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 5000 });
        });
        await apiCall({
          url: '/check-in/me/in',
          method: 'POST',
          data: pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude } : {},
        });
        setToast('Checked in successfully');
        qc.invalidateQueries({ queryKey: ['check-in-status'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Check-in failed');
      }
    });
  };

  const checkOut = (): void => {
    start(async () => {
      try {
        const pos = await new Promise<GeolocationPosition | null>((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 5000 });
        });
        await apiCall({
          url: '/check-in/me/out',
          method: 'POST',
          data: pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude } : {},
        });
        setToast('Checked out. See you tomorrow!');
        qc.invalidateQueries({ queryKey: ['check-in-status'] });
        qc.invalidateQueries({ queryKey: ['check-in-history'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Check-out failed');
      }
    });
  };

  const today = new Date();
  const dayLabel = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const pendingTasks = tasks?.filter((t) => t.status !== 'COMPLETED').length ?? 0;

  return (
    <div className="space-y-6">
      {/* Date + greeting */}
      <div>
        <div className="text-sm text-neutral-500">{dayLabel}</div>
        <h1 className="mt-1 text-2xl font-bold text-brand-900">
          {today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening'}
        </h1>
      </div>

      {/* Check-in/out card — the MAIN action */}
      {isLoading ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
          Loading...
        </div>
      ) : status?.checkOutTime ? (
        // Already checked out for the day
        <div className="rounded-xl border border-success-200 bg-success-50 p-6 text-center">
          <div className="text-4xl">✓</div>
          <div className="mt-3 text-lg font-semibold text-success-800">You&apos;re done for today</div>
          <div className="mt-2 text-sm text-success-700">
            Worked {status.totalHours?.toFixed(1)} hours
          </div>
          <div className="mt-1 text-xs text-neutral-600">
            {status.checkInTime && new Date(status.checkInTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
            {' → '}
            {new Date(status.checkOutTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
      ) : status?.checkedIn ? (
        // Currently checked in — show check-out button
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-6">
          <div className="text-center">
            <div className="text-xs uppercase tracking-wider text-warning-700">Checked in at</div>
            <div className="mt-1 text-2xl font-bold text-warning-900">
              {status.checkInTime && new Date(status.checkInTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
            </div>
            {status.isLate && (
              <div className="mt-1 text-xs font-semibold text-danger-600">Marked as late</div>
            )}
          </div>
          <button
            onClick={checkOut}
            disabled={pending}
            className="mt-6 w-full rounded-xl bg-brand-700 py-5 text-xl font-semibold text-white shadow-md transition hover:bg-brand-800 disabled:opacity-50"
          >
            {pending ? 'Checking out...' : 'Going home — Check out'}
          </button>
        </div>
      ) : (
        // Not checked in yet — show big green button
        <div>
          <button
            onClick={checkIn}
            disabled={pending}
            className="w-full rounded-xl bg-success-600 py-8 text-2xl font-semibold text-white shadow-md transition hover:bg-success-700 disabled:opacity-50"
          >
            {pending ? 'Checking in...' : "I'm here — Check in"}
          </button>
          <p className="mt-2 text-center text-xs text-neutral-500">
            Tap when you arrive at the factory. We&apos;ll record your location.
          </p>
        </div>
      )}

      {toast && (
        <div className="rounded-md bg-brand-50 px-4 py-3 text-sm text-brand-800">{toast}</div>
      )}

      {/* Tasks summary */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-neutral-500">Today&apos;s tasks</div>
            <div className="mt-1 text-2xl font-bold text-brand-900">
              {pendingTasks} {pendingTasks === 1 ? 'task' : 'tasks'}
            </div>
            <div className="text-sm text-neutral-600">waiting for you</div>
          </div>
          <a href="/worker/tasks" className="text-sm font-semibold text-brand-700 hover:underline">
            View →
          </a>
        </div>
      </div>

      {/* This month summary */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="text-xs uppercase tracking-wider text-neutral-500">This month</div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-success-700">{monthData?.summary.daysPresent ?? 0}</div>
            <div className="text-xs text-neutral-600">Days present</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-brand-900">
              {monthData?.summary.totalHours.toFixed(0) ?? 0}
            </div>
            <div className="text-xs text-neutral-600">Total hours</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-danger-600">{monthData?.summary.lateCount ?? 0}</div>
            <div className="text-xs text-neutral-600">Late days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
