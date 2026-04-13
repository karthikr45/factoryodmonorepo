'use client';

import { useEffect, useState } from 'react';

type Step = 0 | 1 | 2 | 3 | 4;

const STEPS = [
  {
    title: 'Agency marks attendance',
    detail: '25 workers marked present via the agency portal',
    actor: 'agency',
  },
  {
    title: 'Factory owner gets notified',
    detail: 'Ravi sees the pending approval on his dashboard',
    actor: 'factory',
  },
  {
    title: 'Factory approves',
    detail: 'One tap approves all 25 records',
    actor: 'factory',
  },
  {
    title: 'Journal entry auto-posts',
    detail: 'DR Wages Expense ₹2,00,000 · CR Wages Payable ₹2,00,000',
    actor: 'system',
  },
  {
    title: 'CA sees it live',
    detail: 'Trial balance updates instantly — no file uploads',
    actor: 'ca',
  },
];

export function LiveDemoSection(): JSX.Element {
  const [step, setStep] = useState<Step>(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => ((s + 1) % STEPS.length) as Step);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-brand-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            See it live
          </div>
          <h2 className="mt-4 text-4xl font-bold text-brand-900 sm:text-5xl">
            One event.
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-highlight-400 bg-clip-text text-transparent">
              Three portals updated instantly.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Watch what happens when the staffing agency marks attendance — and see it flow through
            the factory owner&apos;s approval into the CA&apos;s books in real time.
          </p>
        </div>

        {/* The 3 screens */}
        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {/* Agency screen */}
          <PortalCard
            active={step === 0}
            icon="👷"
            label="Agency Portal"
            accent="accent"
            pulse={step === 0}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Rajesh Yadav</span>
                <span className={`rounded px-1.5 font-semibold ${step >= 0 ? 'bg-success-500 text-white' : 'bg-white/20'}`}>P</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Sunil Goud</span>
                <span className={`rounded px-1.5 font-semibold ${step >= 0 ? 'bg-success-500 text-white' : 'bg-white/20'}`}>P</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Mohan Das</span>
                <span className={`rounded px-1.5 font-semibold ${step >= 0 ? 'bg-success-500 text-white' : 'bg-white/20'}`}>P</span>
              </div>
              <div className="mt-2 rounded bg-white/10 px-2 py-1 text-center text-[10px] text-white/70">
                + 22 more workers
              </div>
            </div>
          </PortalCard>

          {/* Factory screen */}
          <PortalCard
            active={step >= 1 && step <= 3}
            icon="🏭"
            label="Factory Portal"
            accent="brand"
            pulse={step === 1 || step === 2}
          >
            <div className="space-y-2">
              <div className="rounded border border-white/20 bg-white/10 p-2">
                <div className="text-[10px] text-white/60">Pending approvals</div>
                <div className={`mt-0.5 text-xl font-bold transition-colors ${step >= 1 ? 'text-highlight-300' : 'text-white'}`}>
                  25
                </div>
              </div>
              <button
                className={`w-full rounded px-2 py-1.5 text-[11px] font-semibold transition-all ${
                  step === 2
                    ? 'bg-success-500 text-white shadow-lg shadow-success-500/50'
                    : step >= 3
                    ? 'bg-success-500/30 text-success-300'
                    : 'bg-highlight-400 text-white'
                }`}
              >
                {step >= 3 ? '✓ Approved' : step === 2 ? 'Approving...' : 'Approve all'}
              </button>
            </div>
          </PortalCard>

          {/* CA screen */}
          <PortalCard
            active={step === 4}
            icon="📊"
            label="CA Portal"
            accent="highlight"
            pulse={step === 4}
          >
            <div className="space-y-1 text-[11px]">
              <div className="text-[10px] font-semibold uppercase text-white/60">Trial Balance</div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Wages Expense</span>
                <span className={`font-mono font-semibold ${step >= 4 ? 'text-highlight-300' : 'text-white/40'}`}>
                  {step >= 4 ? '₹2,00,000' : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Wages Payable</span>
                <span className={`font-mono font-semibold ${step >= 4 ? 'text-highlight-300' : 'text-white/40'}`}>
                  {step >= 4 ? '₹2,00,000' : '—'}
                </span>
              </div>
              {step >= 4 && (
                <div className="mt-2 animate-fade-in rounded bg-success-500/20 px-2 py-1 text-center text-[9px] font-semibold text-success-300">
                  ✓ DR = CR balanced
                </div>
              )}
            </div>
          </PortalCard>
        </div>

        {/* Current step indicator */}
        <div className="mt-12 mx-auto max-w-2xl">
          <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                {step + 1}
              </div>
              <div className="flex-1 animate-fade-in" key={step}>
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Step {step + 1} of {STEPS.length}
                </div>
                <div className="mt-1 text-lg font-bold text-brand-900">{STEPS[step]!.title}</div>
                <div className="mt-1 text-sm text-neutral-600">{STEPS[step]!.detail}</div>
              </div>
            </div>

            {/* Progress dots */}
            <div className="mt-4 flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    i <= step ? 'bg-brand-600' : 'bg-neutral-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PortalCard({
  children,
  active,
  icon,
  label,
  accent,
  pulse,
}: {
  children: React.ReactNode;
  active: boolean;
  icon: string;
  label: string;
  accent: 'brand' | 'accent' | 'highlight';
  pulse: boolean;
}): JSX.Element {
  const bg =
    accent === 'brand'
      ? 'from-brand-800 to-brand-950'
      : accent === 'accent'
      ? 'from-accent-700 to-accent-900'
      : 'from-highlight-500 to-highlight-700';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 transition-all duration-500 ${bg} ${
        active ? 'scale-105 shadow-2xl' : 'scale-100 opacity-60'
      }`}
    >
      {pulse && (
        <div className="absolute inset-0 animate-pulse bg-white/5" />
      )}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="text-xl">{icon}</span>
            <span className="text-xs font-semibold">{label}</span>
          </div>
          {active && (
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-accent-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-300" />
            </span>
          )}
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
