'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const STEPS = [
  {
    title: 'Welcome to FactoryOS',
    body: "Let's take a 60-second tour of what you can do. Your business is now set up with industry-standard workflows and 8 role templates.",
    action: 'Start tour',
    icon: '👋',
  },
  {
    title: 'Your Workflows are ready',
    body: 'Visit Workflows to see the 8 industry templates we loaded — General, Textile, Pharma, Auto Components and more. You can edit any of them, or use AI to generate one from scratch.',
    action: 'Next',
    link: '/factory/workflows',
    linkLabel: 'Open Workflows',
    icon: '⚙️',
  },
  {
    title: 'Roles are pre-configured',
    body: '8 role templates (Owner, Production Manager, QC Head, Accountant, Store Keeper, Floor Supervisor, HR Manager, Worker) are ready. Each has appropriate permissions across 35 actions.',
    action: 'Next',
    link: '/factory/roles',
    linkLabel: 'Open Roles',
    icon: '👥',
  },
  {
    title: 'Set up your approval flow',
    body: 'Define rules like "Overtime > 2 hours needs Production Manager approval". You can test rules in the simulator before they go live.',
    action: 'Next',
    link: '/factory/approvals',
    linkLabel: 'Open Approvals',
    icon: '✋',
  },
  {
    title: 'AI assistant is always available',
    body: 'See the floating ✨ button bottom-right? Click it anytime to ask questions about your factory or get insights. It also runs anomaly detection on your dashboard automatically.',
    action: 'Next',
    icon: '✨',
  },
  {
    title: "You're ready",
    body: 'Create your first order from the dashboard. Pick a workflow, watch the entire lifecycle on one screen — quote → production → QC → dispatch → invoice → payment, all auto-tracked.',
    action: 'Start using FactoryOS',
    icon: '🚀',
  },
];

const STORAGE_KEY = 'factoryos_onboarding_tour_done';

export function OnboardingTour(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const done = window.localStorage.getItem(STORAGE_KEY);
    if (!done) setOpen(true);
  }, []);

  const close = (): void => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, '1');
    }
    setOpen(false);
  };

  const next = (): void => {
    if (step >= STEPS.length - 1) close();
    else setStep(step + 1);
  };

  if (!open) return null;
  const current = STEPS[step]!;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-950/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg animate-scale-in overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Top gradient */}
        <div className="bg-gradient-to-r from-brand-700 to-highlight-400 p-6 text-white">
          <div className="text-5xl">{current.icon}</div>
          <h2 className="mt-3 text-2xl font-bold">{current.title}</h2>
          <div className="mt-2 text-sm text-white/70">Step {step + 1} of {STEPS.length}</div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-neutral-700">{current.body}</p>

          {/* Progress dots */}
          <div className="mt-6 flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i <= step ? 'bg-brand-700' : 'bg-neutral-200'
                }`} />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button onClick={close} className="text-sm text-neutral-500 hover:text-neutral-800">
              Skip tour
            </button>
            <div className="flex gap-2">
              {current.link && (
                <a href={current.link} target="_blank" rel="noopener noreferrer"
                  className="rounded-md border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                  {current.linkLabel}
                </a>
              )}
              <Button onClick={next}>{current.action}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
