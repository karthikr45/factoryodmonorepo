'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatINR } from '@/lib/utils';

interface Plan {
  id: 'FREE' | 'PRO' | 'GROWTH' | 'ENTERPRISE';
  label: string;
  monthlyPaise: number;
  features: string[];
  requiresSales: boolean;
}

interface MySub {
  plan: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  rzpSubscriptionId: string | null;
}

const STATUS_COLOUR: Record<string, string> = {
  TRIALING: 'bg-warning-50 text-warning-700',
  ACTIVE: 'bg-success-50 text-success-700',
  PAST_DUE: 'bg-danger-50 text-danger-700',
  CANCELLED: 'bg-neutral-100 text-neutral-700',
  EXPIRED: 'bg-neutral-100 text-neutral-700',
};

export default function BillingPage(): JSX.Element {
  const qc = useQueryClient();
  const [pending, start] = useTransition();

  const { data: plans } = useQuery<Plan[]>({
    queryKey: ['billing-plans'],
    queryFn: () => apiCall<Plan[]>({ url: '/billing/plans' }),
  });
  const { data: mine } = useQuery<MySub>({
    queryKey: ['billing-me'],
    queryFn: () => apiCall<MySub>({ url: '/billing/me' }),
  });

  const checkout = (planId: string): void => {
    start(async () => {
      try {
        const res = await apiCall<{ subscriptionId: string; keyId: string | null; devSimulated?: boolean }>({
          url: '/billing/checkout',
          method: 'POST',
          data: { planId },
        });
        if (res.devSimulated) {
          alert(`Activated ${planId} (dev mode — no real payment).`);
          qc.invalidateQueries({ queryKey: ['billing-me'] });
          return;
        }
        // Real Razorpay Checkout — load script if not already.
        await ensureRazorpayScript();
        const rzp = (window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open(): void } }).Razorpay;
        const checkout = new rzp({
          key: res.keyId,
          subscription_id: res.subscriptionId,
          name: 'FactoryOS',
          description: `${planId} subscription`,
          handler: () => {
            qc.invalidateQueries({ queryKey: ['billing-me'] });
          },
        });
        checkout.open();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Checkout failed');
      }
    });
  };

  const cancel = (): void => {
    if (!confirm('Cancel subscription at the end of the current cycle?')) return;
    start(async () => {
      try {
        await apiCall({ url: '/billing/cancel', method: 'POST' });
        qc.invalidateQueries({ queryKey: ['billing-me'] });
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Cancel failed');
      }
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Billing & plan</h1>
      <p className="mt-1 text-neutral-600">Manage your FactoryOS subscription. All prices in INR, billed monthly.</p>

      {mine && (
        <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-brand-700">Current plan</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-bold text-brand-900">{mine.plan}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOUR[mine.status] ?? 'bg-neutral-100 text-neutral-700'}`}>
                  {mine.status}
                </span>
              </div>
              {mine.currentPeriodEnd && (
                <div className="mt-1 text-xs text-neutral-600">
                  Renews on {new Date(mine.currentPeriodEnd).toLocaleDateString('en-IN')}
                </div>
              )}
            </div>
            {mine.status === 'ACTIVE' && (
              <Button variant="outline" onClick={cancel} disabled={pending}>Cancel plan</Button>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(plans ?? []).map((p) => {
          const current = mine?.plan === p.id && mine?.status !== 'CANCELLED';
          return (
            <div key={p.id} className={`flex flex-col rounded-2xl border bg-white p-5 ${current ? 'border-brand-500 ring-2 ring-brand-200' : 'border-neutral-200'}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-bold text-brand-900">{p.label}</h3>
                {current && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">Current</span>}
              </div>
              <div className="mt-2 text-2xl font-bold text-brand-900">
                {p.monthlyPaise === 0 ? (p.requiresSales ? 'Custom' : 'Free') : formatINR(p.monthlyPaise)}
                {p.monthlyPaise > 0 && <span className="text-sm font-normal text-neutral-500">/mo</span>}
              </div>
              <ul className="mt-3 flex-1 space-y-1 text-sm text-neutral-700">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-success-600">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                {p.requiresSales ? (
                  <a href="mailto:sales@factoryos.in" className="block w-full rounded-md border border-brand-300 px-3 py-2 text-center text-sm font-medium text-brand-700 hover:bg-brand-50">
                    Contact sales
                  </a>
                ) : current ? (
                  <Button variant="outline" disabled className="w-full">Active</Button>
                ) : p.id === 'FREE' ? (
                  <Button variant="outline" disabled className="w-full">Default</Button>
                ) : (
                  <Button onClick={() => checkout(p.id)} disabled={pending} className="w-full">
                    {pending ? 'Loading…' : `Switch to ${p.label}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-neutral-500">
        Payments are processed by Razorpay. Cancel any time — your plan stays active until the current cycle ends.
      </p>
    </div>
  );
}

async function ensureRazorpayScript(): Promise<void> {
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(s);
  });
}
