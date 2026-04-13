/**
 * Animated CSS-only dashboard preview shown in the hero.
 * Acts as a "living screenshot" — pulses, animates, draws attention.
 */
export function AnimatedDashboard(): JSX.Element {
  return (
    <div className="relative mx-auto w-full max-w-2xl animate-float-slow">
      {/* Glow halo */}
      <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-highlight-400/30 via-accent-300/30 to-brand-500/30 opacity-60 blur-2xl" />

      {/* Browser frame */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/80 shadow-2xl backdrop-blur">
        {/* Chrome bar */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-neutral-900/80 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-danger-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-success-500" />
          <div className="mx-auto flex items-center gap-1.5 rounded-md bg-neutral-800/60 px-3 py-1 text-xs text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
            factoryos.in/factory
          </div>
        </div>

        {/* Dashboard body */}
        <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-4 sm:p-6">
          {/* Greeting row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/60">Good morning, Ravi</div>
              <div className="text-sm font-semibold text-white">Hyderabad Precision Components</div>
            </div>
            <div className="rounded-lg bg-highlight-400 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-highlight-400/30">
              + New order
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'In production', value: '7', color: 'text-accent-300' },
              { label: 'Revenue MTD', value: '₹3.5L', color: 'text-highlight-300' },
              { label: 'Outstanding', value: '₹4.2L', color: 'text-brand-300' },
            ].map((s, i) => (
              <div
                key={s.label}
                className="rounded-lg border border-white/10 bg-white/5 p-2.5 backdrop-blur"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="text-[10px] uppercase text-white/50">{s.label}</div>
                <div className={`mt-1 text-lg font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Order timeline */}
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-white">ORD-2025-002</div>
              <div className="rounded-full bg-accent-300/20 px-2 py-0.5 text-[10px] font-semibold text-accent-300">
                In production
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1">
              {['✓', '✓', '●', '○', '○', '○'].map((s, i) => (
                <div key={i} className="flex-1">
                  <div
                    className={`h-1.5 rounded-full ${
                      s === '✓' ? 'bg-success-500' : s === '●' ? 'animate-pulse bg-accent-300' : 'bg-white/10'
                    }`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-6 gap-1 text-[9px] text-white/50">
              <span>Cut</span>
              <span>Mach</span>
              <span className="font-semibold text-accent-300">Asm</span>
              <span>QC</span>
              <span>Pack</span>
              <span>Disp</span>
            </div>
          </div>

          {/* Flowing connections to show the 3-portal concept */}
          <div className="mt-4 flex items-center justify-around gap-2 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur">
            {[
              { icon: '🏭', label: 'Factory', color: 'bg-brand-500/30' },
              { icon: '👷', label: 'Agency', color: 'bg-accent-500/30' },
              { icon: '📊', label: 'CA', color: 'bg-highlight-400/30' },
            ].map((p, i, arr) => (
              <div key={p.label} className="contents">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${p.color} text-base`}>
                    {p.icon}
                  </div>
                  <div className="mt-1 text-[10px] text-white/70">{p.label}</div>
                </div>
                {i < arr.length - 1 && (
                  <div className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="absolute inset-y-0 left-0 w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-accent-300 to-transparent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating feature badges */}
      <div className="absolute -left-6 top-20 hidden animate-float rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur md:block">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success-500" />
          Live trial balance
        </div>
      </div>
      <div className="absolute -right-6 bottom-20 hidden animate-float rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur [animation-delay:2s] md:block">
        <div className="flex items-center gap-1.5">
          <span className="text-highlight-400">✨</span>
          Auto-invoice
        </div>
      </div>
    </div>
  );
}
