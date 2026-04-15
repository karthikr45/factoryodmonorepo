'use client';

import { useEffect, useState } from 'react';

interface Stat {
  value: string;
  label: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const FALLBACK: Stat[] = [
  { value: '0', label: 'Orders tracked' },
  { value: '₹0', label: 'GMV processed' },
  { value: 'Coming soon', label: 'Factories' },
  { value: '—', label: 'States' },
  { value: '0', label: 'Workers tracked' },
  { value: '0', label: 'Manual entries' },
  { value: '99.9%', label: 'Uptime' },
  { value: '< 2s', label: 'Journal latency' },
];

export function StatsMarquee(): JSX.Element {
  const [stats, setStats] = useState<Stat[]>(FALLBACK);

  useEffect(() => {
    void fetch(`${apiUrl}/api/content/stats`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.data && Array.isArray(j.data) && j.data.length > 0) setStats(j.data);
      })
      .catch(() => undefined);
  }, []);

  const doubled = [...stats, ...stats];

  return (
    <section className="relative overflow-hidden border-y border-brand-800 bg-brand-950 py-10">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-brand-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-brand-950 to-transparent" />

      <div className="flex animate-marquee gap-12 whitespace-nowrap">
        {doubled.map((s, i) => (
          <div key={i} className="flex items-baseline gap-3">
            <span className="bg-gradient-to-r from-accent-300 to-highlight-400 bg-clip-text text-4xl font-extrabold text-transparent">
              {s.value}
            </span>
            <span className="text-sm uppercase tracking-wider text-white/60">{s.label}</span>
            <span className="text-white/20">•</span>
          </div>
        ))}
      </div>
    </section>
  );
}
