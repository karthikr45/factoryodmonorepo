'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

export function GenerateReturnButton(): JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [type, setType] = useState<'GSTR1' | 'GSTR3B'>('GSTR1');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (): void => {
    setError(null);
    start(async () => {
      try {
        await apiCall({
          url: '/compliance/gst-returns/generate',
          method: 'POST',
          data: { period, type },
        });
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate');
      }
    });
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>Generate return</Button>
    );
  }

  return (
    <div className="rounded-lg border border-brand-200 bg-white p-4">
      <div className="flex items-end gap-3">
        <label className="block">
          <span className="text-xs font-medium text-neutral-600">Period (YYYY-MM)</span>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="mt-1 rounded-md border border-neutral-300 px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-neutral-600">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'GSTR1' | 'GSTR3B')}
            className="mt-1 rounded-md border border-neutral-300 px-2 py-1"
          >
            <option value="GSTR1">GSTR-1</option>
            <option value="GSTR3B">GSTR-3B</option>
          </select>
        </label>
        <Button onClick={submit} disabled={pending}>
          {pending ? 'Generating...' : 'Draft'}
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {error ? (
        <div className="mt-2 text-sm text-danger-700">{error}</div>
      ) : null}
    </div>
  );
}
