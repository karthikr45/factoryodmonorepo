export function BeforeAfterSection(): JSX.Element {
  return (
    <section className="relative overflow-hidden bg-neutral-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="inline-block rounded-full bg-danger-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-danger-700">
            The change you&apos;ll feel
          </div>
          <h2 className="mt-4 text-4xl font-bold text-brand-900 sm:text-5xl">Before vs After</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            This is what changes when you switch from WhatsApp + Excel + Tally to FactoryOS.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* BEFORE */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-danger-200 bg-white p-6">
            <div className="absolute -top-3 left-6 rounded-full bg-danger-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Before
            </div>
            <div className="mt-4 space-y-3">
              {/* Fake WhatsApp chat */}
              <div className="rounded-xl bg-success-500/10 p-3">
                <div className="text-xs font-semibold text-success-700">WhatsApp — Production Group</div>
                <div className="mt-2 space-y-1 text-xs text-neutral-700">
                  <div className="rounded bg-white px-2 py-1">Supervisor: done 200 pcs in cutting</div>
                  <div className="ml-4 rounded bg-success-500/20 px-2 py-1">Owner: ok moving to machining now?</div>
                  <div className="rounded bg-white px-2 py-1">Supervisor: machine is down since morning boss</div>
                  <div className="ml-4 rounded bg-success-500/20 px-2 py-1">Owner: what?? why didn&apos;t u tell me</div>
                </div>
              </div>

              {/* Fake Excel */}
              <div className="rounded-lg border border-neutral-200 bg-white">
                <div className="border-b border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700">
                  attendance_march_2025_FINAL_v3_fixed.xlsx
                </div>
                <div className="grid grid-cols-4 gap-px bg-neutral-200 text-[10px]">
                  {['Worker', '1', '2', '3'].map((h) => (
                    <div key={h} className="bg-neutral-50 px-2 py-1 font-semibold">{h}</div>
                  ))}
                  {['Raju', 'P', 'P', '?'].map((c, i) => (
                    <div key={i} className={`bg-white px-2 py-1 ${c === '?' ? 'bg-warning-100 text-warning-700' : ''}`}>{c}</div>
                  ))}
                  {['Mohan', 'P', '??', 'A'].map((c, i) => (
                    <div key={i + 4} className={`bg-white px-2 py-1 ${c.includes('?') ? 'bg-warning-100 text-warning-700' : ''}`}>{c}</div>
                  ))}
                </div>
              </div>

              {/* Fake Tally */}
              <div className="rounded-lg border border-neutral-200 bg-neutral-900 p-3 font-mono text-[10px] text-neutral-100">
                <div className="text-success-400">Tally ERP 9 — Last synced 23 days ago</div>
                <div className="mt-1 text-neutral-400">Gateway &gt; Day Book &gt; ...</div>
                <div className="text-neutral-500">No entries for last 23 days</div>
              </div>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-neutral-700">
              {[
                'Orders scattered across WhatsApp groups',
                'Attendance disputed at month-end every time',
                'CA works from files that are a month stale',
                'ITC mismatches every GST filing',
                'No idea which orders made profit',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-danger-500">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AFTER */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-accent-300 bg-gradient-to-br from-accent-50 to-white p-6">
            <div className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-accent-500 to-brand-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              After
            </div>

            <div className="mt-4 space-y-3">
              {/* Clean dashboard preview */}
              <div className="rounded-xl border border-brand-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-brand-900">Dashboard · Today</div>
                  <span className="flex h-2 w-2 rounded-full bg-success-500">
                    <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-success-500 opacity-75" />
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                  <div className="rounded bg-brand-50 p-1.5">
                    <div className="text-neutral-500">In production</div>
                    <div className="font-bold text-brand-900">7</div>
                  </div>
                  <div className="rounded bg-success-50 p-1.5">
                    <div className="text-neutral-500">Revenue</div>
                    <div className="font-bold text-success-700">₹3.5L</div>
                  </div>
                  <div className="rounded bg-highlight-50 p-1.5">
                    <div className="text-neutral-500">Outstanding</div>
                    <div className="font-bold text-highlight-500">₹4.2L</div>
                  </div>
                </div>
              </div>

              {/* Clean attendance */}
              <div className="rounded-xl border border-brand-200 bg-white p-3 shadow-sm">
                <div className="text-xs font-semibold text-brand-900">Attendance — auto-approved</div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <div className="h-2 flex-1 rounded-full bg-neutral-100">
                    <div className="h-2 w-[95%] rounded-full bg-gradient-to-r from-accent-500 to-brand-600" />
                  </div>
                  <span className="font-semibold text-brand-700">95%</span>
                </div>
                <div className="mt-1 text-[10px] text-neutral-500">25 of 26 workers · wages auto-posted</div>
              </div>

              {/* Live books */}
              <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-900 to-brand-950 p-3 font-mono text-[10px] text-white">
                <div className="text-accent-300">FactoryOS Books — Live · updated 3s ago</div>
                <div className="mt-1 flex justify-between">
                  <span className="text-white/70">Wages Expense</span>
                  <span className="text-highlight-300">DR ₹2,00,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Wages Payable</span>
                  <span className="text-highlight-300">CR ₹2,00,000</span>
                </div>
                <div className="mt-1 text-success-400">✓ Balanced · CA can see this now</div>
              </div>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-neutral-700">
              {[
                'Orders tracked end-to-end in one place',
                'Attendance approved once, never disputed',
                'CA sees the journal entry in 3 seconds',
                'GST returns auto-drafted from real data',
                'Profit per order shown after every dispatch',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent-600">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
