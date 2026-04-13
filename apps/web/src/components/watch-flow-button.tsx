'use client';

import { useState } from 'react';

import { DemoModal } from './demo-modal';

export function WatchFlowButton({ className }: { className?: string }): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className ?? 'rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur transition hover:border-white/40 hover:bg-white/10'}
      >
        ▶ Watch the flow
      </button>
      <DemoModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
