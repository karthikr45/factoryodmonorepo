'use client';

import { useQuery } from '@tanstack/react-query';

import { apiCall } from '@/lib/api';

interface Anomaly {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  suggestion: string;
}

export function AnomaliesWidget(): JSX.Element | null {
  const { data, isLoading } = useQuery<Anomaly[]>({
    queryKey: ['anomalies'],
    queryFn: () => apiCall<Anomaly[]>({ url: '/ai/anomalies' }),
    refetchInterval: 60_000, // refresh every minute
  });

  if (isLoading || !data || data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-highlight-200 bg-gradient-to-br from-highlight-50 to-white p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-700 to-highlight-400 text-white shadow-md">
          <span className="animate-pulse">✨</span>
        </div>
        <div>
          <h2 className="font-semibold text-brand-900">AI detected {data.length} thing{data.length === 1 ? '' : 's'} you should know</h2>
          <p className="text-xs text-neutral-500">Powered by Claude · auto-refreshes every minute</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {data.slice(0, 5).map((a, i) => (
          <div
            key={i}
            className={`rounded-lg border p-3 ${
              a.severity === 'critical'
                ? 'border-danger-200 bg-danger-50'
                : a.severity === 'warning'
                ? 'border-warning-200 bg-warning-50'
                : 'border-brand-200 bg-brand-50'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-base leading-none">
                {a.severity === 'critical' ? '🚨' : a.severity === 'warning' ? '⚠️' : 'ℹ️'}
              </span>
              <div className="flex-1">
                <div className={`font-semibold ${
                  a.severity === 'critical' ? 'text-danger-900'
                    : a.severity === 'warning' ? 'text-warning-900'
                    : 'text-brand-900'
                }`}>
                  {a.title}
                </div>
                <div className="mt-0.5 text-sm text-neutral-700">{a.detail}</div>
                <div className="mt-1.5 text-xs italic text-neutral-600">→ {a.suggestion}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
