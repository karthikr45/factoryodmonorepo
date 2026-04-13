const STATS = [
  { value: '3,500+', label: 'Orders tracked' },
  { value: '₹120 Cr', label: 'GMV processed' },
  { value: '45', label: 'Factories' },
  { value: '12', label: 'States' },
  { value: '2,800+', label: 'Workers deployed' },
  { value: '0', label: 'Manual entries' },
  { value: '99.9%', label: 'Uptime' },
  { value: '< 2s', label: 'Journal latency' },
];

export function StatsMarquee(): JSX.Element {
  // Duplicate the array so the marquee loops seamlessly
  const doubled = [...STATS, ...STATS];

  return (
    <section className="relative overflow-hidden border-y border-brand-800 bg-brand-950 py-10">
      {/* Gradient fades on left/right edges */}
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
