'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

const VERTICALS = [
  { value: 'TEXTILE', label: 'Textile / Garments' },
  { value: 'AUTO_COMPONENTS', label: 'Auto Components' },
  { value: 'PHARMA', label: 'Pharma' },
  { value: 'FOOD_PROCESSING', label: 'Food Processing' },
  { value: 'JOB_WORK', label: 'Job Work / CNC' },
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'OTHER', label: 'Other' },
];

const WORKER_COUNTS = ['1-10', '10-50', '50-200', '200+'];

export function WaitlistForm({ source = 'landing' }: { source?: string }): JSX.Element {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [vertical, setVertical] = useState('');
  const [workerCount, setWorkerCount] = useState('');
  const [pending, start] = useTransition();
  const [state, setState] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(null);

  const submit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    start(async () => {
      try {
        const res = await apiCall<{ id: string; position: number }>({
          url: '/waitlist', method: 'POST',
          data: {
            email, phone: phone || undefined, businessName: businessName || undefined,
            vertical: vertical || undefined, workerCount: workerCount || undefined,
            source,
          },
        });
        setPosition(res.position);
        setState('success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join waitlist');
        setState('error');
      }
    });
  };

  if (state === 'success') {
    return (
      <div className="animate-fade-in-up rounded-2xl border-2 border-accent-400 bg-gradient-to-br from-accent-50 to-white p-8 text-center">
        <div className="mx-auto flex h-16 w-16 animate-scale-in items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-brand-600 text-3xl text-white shadow-lg shadow-accent-500/40">
          ✓
        </div>
        <h3 className="mt-4 text-2xl font-bold text-brand-900">You&apos;re on the list!</h3>
        <p className="mt-2 text-neutral-600">
          {position !== null ? (
            <>You&apos;re <span className="font-semibold text-brand-700">#{position}</span> in line. </>
          ) : null}
          We&apos;ll email you when FactoryOS launches — estimated in 10 weeks.
        </p>
        <p className="mt-4 text-sm text-neutral-500">
          First 50 on the waitlist get the Growth plan at <span className="font-semibold text-highlight-500">₹2,999/mo for life</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-neutral-700">Your email *</label>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@factory.in"
          className="mt-1.5 w-full rounded-lg border border-neutral-300 px-4 py-3 text-base transition focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-neutral-700">Business name</label>
          <input
            value={businessName} onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Hyderabad Precision"
            className="mt-1.5 w-full rounded-lg border border-neutral-300 px-4 py-3 text-base transition focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700">Phone</label>
          <input
            type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9876543210"
            className="mt-1.5 w-full rounded-lg border border-neutral-300 px-4 py-3 text-base transition focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-neutral-700">Your industry</label>
          <select
            value={vertical} onChange={(e) => setVertical(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-neutral-300 px-4 py-3 text-base transition focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
          >
            <option value="">Select industry</option>
            {VERTICALS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700">Worker count</label>
          <select
            value={workerCount} onChange={(e) => setWorkerCount(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-neutral-300 px-4 py-3 text-base transition focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
          >
            <option value="">Select size</option>
            {WORKER_COUNTS.map((w) => (
              <option key={w} value={w}>{w} workers</option>
            ))}
          </select>
        </div>
      </div>

      <Button type="submit" disabled={pending || !email} className="w-full rounded-lg py-3.5 text-base font-semibold shadow-lg shadow-brand-600/30">
        {pending ? 'Joining...' : 'Get early access'}
      </Button>
      <p className="text-center text-xs text-neutral-500">
        First 50 signups get the Growth plan at <span className="font-semibold text-highlight-500">₹2,999/mo for life</span>.
      </p>

      {error && (
        <div className="rounded-md bg-danger-50 px-4 py-2 text-sm text-danger-700">{error}</div>
      )}
    </form>
  );
}
