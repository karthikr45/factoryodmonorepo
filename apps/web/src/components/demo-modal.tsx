'use client';

import { useEffect, useState } from 'react';

const SCENES = [
  {
    title: 'A customer calls with an enquiry',
    subtitle: 'Ravi opens FactoryOS on his phone',
    visual: 'enquiry',
  },
  {
    title: 'Quote sent via WhatsApp',
    subtitle: 'Customer accepts in minutes',
    visual: 'quotation',
  },
  {
    title: 'Order confirmed → job cards generated',
    subtitle: 'All 6 departments notified automatically',
    visual: 'jobcards',
  },
  {
    title: 'Production moves stage by stage',
    subtitle: 'Floor managers tap to update progress',
    visual: 'production',
  },
  {
    title: 'Quality check — one tap pass/fail',
    subtitle: 'Order auto-advances to Ready',
    visual: 'qc',
  },
  {
    title: 'Dispatch with e-way bill',
    subtitle: 'GST invoice generates automatically',
    visual: 'dispatch',
  },
  {
    title: 'Books update themselves',
    subtitle: 'Your CA sees the journal entry instantly',
    visual: 'books',
  },
];

export function DemoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): JSX.Element | null {
  const [scene, setScene] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    const t = setInterval(() => {
      setScene((s) => (s + 1) % SCENES.length);
    }, 3000);
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (open) {
      setScene(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const current = SCENES[scene]!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl animate-scale-in overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-brand-900 to-brand-950 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Content */}
        <div className="relative p-8 sm:p-12">
          {/* Background blobs */}
          <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 animate-blob rounded-full bg-highlight-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 animate-blob rounded-full bg-accent-300/20 blur-3xl [animation-delay:2s]" />

          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent-300">
              Live demo · Scene {scene + 1} of {SCENES.length}
            </div>
            <h3 className="mt-2 animate-fade-in text-3xl font-bold text-white" key={`title-${scene}`}>
              {current.title}
            </h3>
            <p className="mt-2 animate-fade-in text-lg text-white/70" key={`sub-${scene}`}>
              {current.subtitle}
            </p>

            {/* Animated visual for each scene */}
            <div className="mt-8 min-h-[320px] rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <SceneVisual visual={current.visual} key={scene} />
            </div>

            {/* Progress bar */}
            <div className="mt-6 flex gap-1">
              {SCENES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    i === scene
                      ? 'bg-gradient-to-r from-accent-300 to-highlight-400'
                      : i < scene
                      ? 'bg-white/40'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/signup"
                className="rounded-lg bg-gradient-to-r from-highlight-400 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-highlight-400/30 transition hover:shadow-xl"
              >
                Start free — 60 seconds
              </a>
              <button
                onClick={() => setScene((s) => (s + 1) % SCENES.length)}
                className="rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Next scene →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneVisual({ visual }: { visual: string }): JSX.Element {
  switch (visual) {
    case 'enquiry':
      return (
        <div className="animate-fade-in space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3">
            <div className="h-10 w-10 rounded-full bg-accent-300/30" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">Mahindra Auto</div>
              <div className="text-xs text-white/60">Incoming call · 2m ago</div>
            </div>
            <span className="rounded-full bg-success-500 px-2 py-0.5 text-xs font-semibold text-white">New</span>
          </div>
          <div className="rounded-lg border border-highlight-400/50 bg-highlight-400/10 p-3">
            <div className="text-xs font-semibold uppercase text-highlight-300">+ New enquiry</div>
            <div className="mt-1 text-white">500 brake brackets by Friday</div>
          </div>
        </div>
      );
    case 'quotation':
      return (
        <div className="animate-fade-in space-y-3">
          <div className="rounded-lg bg-white/10 p-4">
            <div className="text-xs text-white/60">QTN-2025-087</div>
            <div className="mt-1 font-mono text-xs text-white/80">
              500 × Brake Bracket @ ₹700<br />
              Subtotal: ₹3,50,000<br />
              GST 18%: ₹63,000<br />
              <span className="font-bold text-highlight-300">Total: ₹4,13,000</span>
            </div>
          </div>
          <div className="rounded-lg bg-success-500/20 p-3 text-center text-sm text-success-300">
            ✓ Sent via WhatsApp · Customer accepted 14 min later
          </div>
        </div>
      );
    case 'jobcards':
      return (
        <div className="animate-fade-in">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {['Cutting', 'Machining', 'Assembly', 'QC', 'Packing', 'Dispatch'].map((d, i) => (
              <div
                key={d}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-center animate-scale-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="text-[10px] text-white/50">Stage {i + 1}</div>
                <div className="mt-1 text-xs font-semibold text-white">{d}</div>
                <div className="mt-2 text-[10px] text-accent-300">● Pending</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded bg-accent-300/10 p-3 text-center text-xs text-accent-300">
            ✨ 6 job cards generated · Each department manager notified
          </div>
        </div>
      );
    case 'production':
      return (
        <div className="animate-fade-in space-y-2">
          {[
            { d: 'Cutting', s: 'done', by: 'Anil' },
            { d: 'Machining', s: 'done', by: 'Srinivas' },
            { d: 'Assembly', s: 'now', by: 'Srinivas' },
            { d: 'QC', s: 'next', by: '—' },
          ].map((r) => (
            <div key={r.d} className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  r.s === 'done' ? 'bg-success-500' : r.s === 'now' ? 'animate-pulse bg-accent-300' : 'bg-white/20'
                }`}
              />
              <div className="flex-1 text-sm font-semibold text-white">{r.d}</div>
              <div className="text-xs text-white/60">{r.by}</div>
              <div className={`text-xs font-semibold ${r.s === 'done' ? 'text-success-300' : r.s === 'now' ? 'text-accent-300' : 'text-white/40'}`}>
                {r.s === 'done' ? '✓' : r.s === 'now' ? 'in progress' : 'pending'}
              </div>
            </div>
          ))}
        </div>
      );
    case 'qc':
      return (
        <div className="animate-fade-in space-y-3">
          <div className="rounded-lg bg-white/5 p-4">
            <div className="text-xs font-semibold uppercase text-white/60">QC Checklist</div>
            <div className="mt-2 space-y-2 text-sm text-white/80">
              <div className="flex items-center gap-2"><span className="text-success-400">✓</span> Dimensional accuracy — within tolerance</div>
              <div className="flex items-center gap-2"><span className="text-success-400">✓</span> Surface finish — Ra 3.2</div>
              <div className="flex items-center gap-2"><span className="text-success-400">✓</span> Count verification — 500 pcs</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 animate-ring-pulse rounded-lg bg-success-500 px-4 py-3 font-semibold text-white">
              ✓ QC Pass
            </button>
            <button className="rounded-lg bg-white/10 px-4 py-3 text-sm text-white/60">Fail</button>
            <button className="rounded-lg bg-white/10 px-4 py-3 text-sm text-white/60">Rework</button>
          </div>
        </div>
      );
    case 'dispatch':
      return (
        <div className="animate-fade-in space-y-3">
          <div className="rounded-lg bg-white/5 p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-white/50">Vehicle</div>
                <div className="font-mono font-semibold text-white">TS09EA1234</div>
              </div>
              <div>
                <div className="text-xs text-white/50">Driver</div>
                <div className="font-semibold text-white">Kumar</div>
              </div>
              <div>
                <div className="text-xs text-white/50">E-way bill</div>
                <div className="font-mono font-semibold text-white">1234-5678-9012</div>
              </div>
              <div>
                <div className="text-xs text-white/50">Status</div>
                <div className="font-semibold text-accent-300">Dispatched</div>
              </div>
            </div>
          </div>
          <div className="animate-fade-in rounded-lg bg-gradient-to-r from-accent-500/20 to-highlight-400/20 p-3 text-center text-sm text-white [animation-delay:500ms]">
            ✨ Invoice INV-087 auto-generated · ₹4,13,000 · Sent to customer
          </div>
        </div>
      );
    case 'books':
      return (
        <div className="animate-fade-in">
          <div className="rounded-lg bg-neutral-950 p-4 font-mono text-xs">
            <div className="text-success-400">FactoryOS Books · Live</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-white/80">
              <span>Accounts Receivable</span><span className="text-right text-highlight-300">DR 4,13,000</span>
              <span>Sales Revenue</span><span className="text-right text-highlight-300">CR 3,50,000</span>
              <span>Output GST</span><span className="text-right text-highlight-300">CR 63,000</span>
            </div>
            <div className="mt-3 border-t border-white/10 pt-2 text-accent-300">
              ✓ DR = CR · Journal posted automatically
            </div>
            <div className="mt-1 text-white/50">Your CA sees this now at reddyca.in/ca</div>
          </div>
        </div>
      );
    default:
      return <div className="text-white/50">Loading...</div>;
  }
}
