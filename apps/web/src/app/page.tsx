import Link from 'next/link';

const JOURNEY_FACTORY = [
  { step: '1', title: 'Sign up in 60 seconds', desc: 'Enter your phone, verify OTP. No credit card.' },
  { step: '2', title: 'Set up your factory', desc: 'We auto-create your departments, chart of accounts, and default workflows.' },
  { step: '3', title: 'Invite your team', desc: 'Production manager, QC head, accountant, floor staff — each gets their own view.' },
  { step: '4', title: 'Connect your CA and staffing agencies', desc: 'One click — your CA sees live books, your agency can deploy workers.' },
  { step: '5', title: 'Run operations', desc: 'Quotations → orders → production → dispatch → invoice. Books update automatically.' },
];

const JOURNEY_AGENCY = [
  { step: '1', title: 'Register your agency', desc: 'Phone + GSTIN. 60 seconds to get started.' },
  { step: '2', title: 'Add your workers', desc: 'Name, Aadhaar last 4, skill, daily rate, EPF/ESIC numbers.' },
  { step: '3', title: 'Connect to factories', desc: 'Factories send you connection requests. Accept to start supplying labour.' },
  { step: '4', title: 'Deploy and track', desc: 'Assign workers to factories. Mark daily attendance in a simple grid.' },
  { step: '5', title: 'Generate payroll', desc: 'Monthly payroll with EPF/ESIC auto-calculated. No Excel hell.' },
];

const JOURNEY_CA = [
  { step: '1', title: 'Sign up as CA', desc: 'Register your CA firm on the platform.' },
  { step: '2', title: 'Factories invite you', desc: 'Your clients add you as their CA. You see their books instantly.' },
  { step: '3', title: 'Live trial balance', desc: 'No more waiting for Tally files. Every entry posts in real time.' },
  { step: '4', title: 'File GST returns', desc: 'GSTR-1 and GSTR-3B generated from actual transactions.' },
  { step: '5', title: 'Raise queries', desc: 'Spot issues? Flag them to the factory owner and get responses in-app.' },
];

export default function LandingPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-neutral-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-900 text-sm font-bold text-white">F</div>
            <span className="text-lg font-bold text-brand-900">FactoryOS</span>
          </div>
          <div className="hidden gap-6 md:flex">
            <a href="#factory" className="text-sm text-neutral-600 hover:text-brand-900">For Factories</a>
            <a href="#agency" className="text-sm text-neutral-600 hover:text-brand-900">For Agencies</a>
            <a href="#ca" className="text-sm text-neutral-600 hover:text-brand-900">For CAs</a>
            <a href="#how" className="text-sm text-neutral-600 hover:text-brand-900">How it works</a>
            <a href="#pricing" className="text-sm text-neutral-600 hover:text-brand-900">Pricing</a>
          </div>
          <div className="flex gap-2">
            <Link href="/login" className="text-sm font-semibold text-brand-700 hover:text-brand-800 px-4 py-2">Sign in</Link>
            <Link href="/signup" className="rounded-md bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-800">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 py-24 text-white sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white/90">
            India&apos;s operating system for manufacturing businesses
          </div>
          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            One platform.
            <br />
            <span className="text-accent-400">Factory, Agency, and CA — connected.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-white/80">
            Stop running your factory on WhatsApp, diaries, and Tally files. FactoryOS connects
            factory owners, staffing agencies, and chartered accountants on one platform — where
            every business operation automatically creates an accounting entry. Your books write
            themselves.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="rounded-lg bg-accent-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-accent-500/25 transition hover:bg-accent-600">
              Start free — 60 seconds
            </Link>
            <a href="#factory" className="rounded-lg border border-white/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10">
              See how it works
            </a>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-accent-400">3-in-1</div>
              <div className="mt-1 text-sm text-white/60">Factory + Agency + CA portals</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent-400">0</div>
              <div className="mt-1 text-sm text-white/60">Manual bookkeeping entries</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent-400">Live</div>
              <div className="mt-1 text-sm text-white/60">Trial balance, always current</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-neutral-100 bg-neutral-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-600">The reality today</h2>
            <p className="mt-4 text-3xl font-bold text-brand-900">
              Your factory runs on 5 disconnected tools
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '💬', title: 'WhatsApp chaos', desc: 'Orders, updates, queries — all buried in group chats.' },
              { icon: '📓', title: 'Paper registers', desc: 'Production stages tracked in notebooks. Lost when it rains.' },
              { icon: '📊', title: 'Excel for attendance', desc: 'Agency says 25 workers. Factory says 22. Fight every month.' },
              { icon: '💾', title: '30-day-stale Tally', desc: 'CA works from files that are already a month old.' },
              { icon: '❓', title: 'No real cost picture', desc: 'Which order made money? Which one bled? Nobody knows.' },
              { icon: '⚠️', title: 'GST penalties', desc: 'ITC mismatches from manual reconciliation. Every quarter.' },
            ].map((p) => (
              <div key={p.title} className="rounded-lg border border-neutral-200 bg-white p-5">
                <div className="text-2xl">{p.icon}</div>
                <h3 className="mt-2 font-semibold text-brand-900">{p.title}</h3>
                <p className="mt-1 text-sm text-neutral-600">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Factory Owners */}
      <section id="factory" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
                For Factory Owners
              </div>
              <h2 className="mt-4 text-3xl font-bold text-brand-900">
                Run your factory from your phone
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Take an enquiry, send a quotation, track production through every department, dispatch
                with e-way bill, and watch the invoice generate itself. Every stage triggers the next.
              </p>
              <ul className="mt-6 space-y-3 text-neutral-700">
                <li className="flex gap-2"><span className="text-success-600">✓</span> Enquiry → Quotation → Order → Production → QC → Dispatch → Invoice — all connected</li>
                <li className="flex gap-2"><span className="text-success-600">✓</span> See every employee — direct staff + contract workers in one view</li>
                <li className="flex gap-2"><span className="text-success-600">✓</span> Approve attendance once, wages post to your books automatically</li>
                <li className="flex gap-2"><span className="text-success-600">✓</span> Real profit per order — revenue minus materials minus labour</li>
                <li className="flex gap-2"><span className="text-success-600">✓</span> Your CA sees the books live — no more stale Tally files</li>
              </ul>
              <Link href="/signup?role=FACTORY" className="mt-8 inline-block rounded-lg bg-brand-700 px-6 py-3 font-semibold text-white hover:bg-brand-800">
                Start your factory free
              </Link>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <div className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Your journey</div>
              <ol className="mt-4 space-y-4">
                {JOURNEY_FACTORY.map((s) => (
                  <li key={s.step} className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white">{s.step}</div>
                    <div>
                      <div className="font-semibold text-brand-900">{s.title}</div>
                      <div className="text-sm text-neutral-600">{s.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* For Staffing Agencies */}
      <section id="agency" className="border-y border-neutral-100 bg-neutral-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 rounded-xl border border-neutral-200 bg-white p-6 lg:order-1">
              <div className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Your journey</div>
              <ol className="mt-4 space-y-4">
                {JOURNEY_AGENCY.map((s) => (
                  <li key={s.step} className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-600 text-sm font-bold text-white">{s.step}</div>
                    <div>
                      <div className="font-semibold text-brand-900">{s.title}</div>
                      <div className="text-sm text-neutral-600">{s.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-block rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-700">
                For Staffing Agencies
              </div>
              <h2 className="mt-4 text-3xl font-bold text-brand-900">
                End attendance disputes forever
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                You mark. Factory approves. Both sides see the same numbers. No end-of-month fights.
                EPF/ESIC auto-calculated. Payroll generated in one click.
              </p>
              <ul className="mt-6 space-y-3 text-neutral-700">
                <li className="flex gap-2"><span className="text-success-600">✓</span> Register workers with Aadhaar + EPF/ESIC</li>
                <li className="flex gap-2"><span className="text-success-600">✓</span> Connect to multiple factories</li>
                <li className="flex gap-2"><span className="text-success-600">✓</span> Mark daily attendance on a simple grid</li>
                <li className="flex gap-2"><span className="text-success-600">✓</span> Instant dispute notifications from factories</li>
                <li className="flex gap-2"><span className="text-success-600">✓</span> Auto-generate monthly payroll with all deductions</li>
              </ul>
              <Link href="/signup?role=AGENCY" className="mt-8 inline-block rounded-lg bg-accent-600 px-6 py-3 font-semibold text-white hover:bg-accent-700">
                Start your agency free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* For CAs */}
      <section id="ca" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
                For CAs &amp; Auditors
              </div>
              <h2 className="mt-4 text-3xl font-bold text-brand-900">
                Live books across all your clients
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Stop asking clients for backup files every month. Every transaction at your client
                factories posts to a journal in real time — you file GST returns from actual data.
              </p>
              <ul className="mt-6 space-y-3 text-neutral-700">
                <li className="flex gap-2"><span className="text-success-600">✓</span> One dashboard for all your manufacturing clients</li>
                <li className="flex gap-2"><span className="text-success-600">✓</span> Live trial balance — DR=CR always checks out</li>
                <li className="flex gap-2"><span className="text-success-600">✓</span> GSTR-1, GSTR-3B drafts generated from real transactions</li>
                <li className="flex gap-2"><span className="text-success-600">✓</span> Input vs output GST reconciled automatically</li>
                <li className="flex gap-2"><span className="text-success-600">✓</span> Raise queries with clients in-app</li>
              </ul>
              <Link href="/signup?role=CA_FIRM" className="mt-8 inline-block rounded-lg bg-brand-700 px-6 py-3 font-semibold text-white hover:bg-brand-800">
                Start as a CA free
              </Link>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <div className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Your journey</div>
              <ol className="mt-4 space-y-4">
                {JOURNEY_CA.map((s) => (
                  <li key={s.step} className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">{s.step}</div>
                    <div>
                      <div className="font-semibold text-brand-900">{s.title}</div>
                      <div className="text-sm text-neutral-600">{s.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* How it works together */}
      <section id="how" className="border-y border-neutral-100 bg-brand-900 py-20 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-400">The magic</h2>
          <p className="mt-4 text-3xl font-bold">
            One business event. Three portals updated simultaneously.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            When the staffing agency marks attendance for 25 workers, the factory owner gets a notification.
            When the factory owner approves, wages post to the ledger. When the CA logs in, the trial balance
            already reflects it. No syncing. No uploads. No delays.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[
              { n: '1', actor: 'Agency', action: 'Marks attendance for 25 workers' },
              { n: '2', actor: 'Factory', action: 'Approves — wages auto-post to journal' },
              { n: '3', actor: 'CA', action: 'Sees the wage expense in trial balance, instantly' },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-white/10 bg-white/5 p-6 text-left">
                <div className="text-xs font-semibold uppercase tracking-wider text-accent-400">Step {s.n}</div>
                <div className="mt-2 text-lg font-semibold">{s.actor}</div>
                <div className="mt-1 text-sm text-white/70">{s.action}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-600">Pricing</h2>
            <p className="mt-4 text-3xl font-bold text-brand-900">
              Free to start. Pay as you grow.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-8">
              <div className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Free</div>
              <div className="mt-2 text-4xl font-bold text-brand-900">₹0<span className="text-lg font-normal text-neutral-500">/month</span></div>
              <p className="mt-2 text-sm text-neutral-600">Perfect for getting started</p>
              <ul className="mt-6 space-y-2 text-sm text-neutral-700">
                <li>✓ Up to 20 workers</li>
                <li>✓ Up to 50 orders/month</li>
                <li>✓ 1 CA connection</li>
                <li>✓ Basic reports</li>
                <li>✓ In-app chat</li>
              </ul>
              <Link href="/signup" className="mt-8 block w-full rounded-lg border border-brand-700 bg-white py-3 text-center font-semibold text-brand-700 hover:bg-brand-50">
                Start free
              </Link>
            </div>
            <div className="rounded-xl border-2 border-accent-500 bg-white p-8 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold uppercase tracking-wider text-accent-600">Pro</div>
                <span className="rounded-full bg-accent-500 px-2 py-0.5 text-xs font-semibold text-white">Most popular</span>
              </div>
              <div className="mt-2 text-4xl font-bold text-brand-900">₹2,999<span className="text-lg font-normal text-neutral-500">/month</span></div>
              <p className="mt-2 text-sm text-neutral-600">For growing manufacturers</p>
              <ul className="mt-6 space-y-2 text-sm text-neutral-700">
                <li>✓ Unlimited workers</li>
                <li>✓ Unlimited orders</li>
                <li>✓ Multiple agencies + CAs</li>
                <li>✓ Advanced reports &amp; profit/order</li>
                <li>✓ WhatsApp integration</li>
                <li>✓ Video calls</li>
                <li>✓ GST filing support</li>
              </ul>
              <Link href="/signup?plan=PRO" className="mt-8 block w-full rounded-lg bg-accent-500 py-3 text-center font-semibold text-white hover:bg-accent-600">
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-brand-900 to-brand-950 py-20 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-extrabold">Stop running your factory on WhatsApp</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
            Join manufacturers across Hyderabad who are getting real-time visibility into their
            operations and letting their books write themselves.
          </p>
          <Link href="/signup" className="mt-8 inline-block rounded-lg bg-accent-500 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-accent-500/25 transition hover:bg-accent-600">
            Start free — 60 seconds
          </Link>
          <p className="mt-4 text-sm text-white/40">No credit card required. Free plan available.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-neutral-500">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-900 text-xs font-bold text-white">F</div>
            <span className="font-semibold text-brand-900">FactoryOS</span>
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-brand-900">Sign in</Link>
            <Link href="/signup" className="hover:text-brand-900">Sign up</Link>
            <a href="#pricing" className="hover:text-brand-900">Pricing</a>
          </div>
          <p>Built for Indian manufacturing. All amounts in INR. GST compliant.</p>
        </div>
      </footer>
    </main>
  );
}
