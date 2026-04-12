import Link from 'next/link';

const FEATURES = [
  {
    icon: '1',
    title: 'Order to Dispatch',
    desc: 'Track every order from enquiry to delivery. Auto-generate job cards for each production stage. Never lose an order in WhatsApp again.',
  },
  {
    icon: '2',
    title: 'Production Pipeline',
    desc: 'Departments see only their job cards. Mark stages complete from phone. Owner gets real-time visibility without being the bottleneck.',
  },
  {
    icon: '3',
    title: 'Attendance Without Disputes',
    desc: 'Agency marks. Factory approves. Both sides see the same numbers. No more end-of-month fights over who worked how many days.',
  },
  {
    icon: '4',
    title: 'Auto-Accounting',
    desc: 'Every dispatch creates a sale entry. Every GRN books inventory. Every approval accrues wages. Your books write themselves.',
  },
  {
    icon: '5',
    title: 'GST Ready',
    desc: 'GSTR-1 and GSTR-3B generated from actual transactions. Input vs output GST reconciled automatically. No more ITC mismatches.',
  },
  {
    icon: '6',
    title: 'Real Profit Per Order',
    desc: 'Know which orders make money and which bleed. Revenue, material cost, and labour mapped to every order automatically.',
  },
];

const ROLES = [
  {
    title: 'Factory Owner',
    subtitle: 'Run your operations',
    color: 'bg-brand-900',
    items: [
      'Dashboard with live production status',
      'Create orders, track through departments',
      'Approve attendance in one click',
      'See P&L and cash flow in real time',
      'Generate purchase orders for raw material',
    ],
  },
  {
    title: 'Staffing Agency',
    subtitle: 'Manage your workforce',
    color: 'bg-accent-600',
    items: [
      'Register workers with Aadhaar + EPF/ESIC',
      'Deploy workers to factories',
      'Mark daily attendance on a grid',
      'Auto-generate monthly payroll',
      'Track disputed and approved records',
    ],
  },
  {
    title: 'CA / Auditor',
    subtitle: 'Live books, no Tally files',
    color: 'bg-brand-700',
    items: [
      'Real-time trial balance across clients',
      'Journal entries post automatically',
      'Draft GSTR-1 and GSTR-3B from live data',
      'Profit & loss reports on demand',
      'Flag anomalies before they become penalties',
    ],
  },
];

const STEPS = [
  { step: '01', title: 'Sign up with your phone', desc: 'OTP login. No passwords to remember. Works on any Android phone.' },
  { step: '02', title: 'Set up your business', desc: 'Tell us your business type. We auto-create your chart of accounts and department pipeline.' },
  { step: '03', title: 'Start operating', desc: 'Create your first order. Every action from here creates an accounting entry. Your CA sees it instantly.' },
];

export default function LandingPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-neutral-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-900 text-sm font-bold text-white">
              F
            </div>
            <span className="text-lg font-bold text-brand-900">FactoryOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-md bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 py-24 text-white sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white/90">
            Built for Hyderabad manufacturers
          </div>
          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Run your factory.
            <br />
            <span className="text-accent-400">Your books write themselves.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            FactoryOS connects factory owners, staffing agencies, and chartered accountants on one platform.
            Every business operation automatically creates an accounting entry. No manual bookkeeping.
            No WhatsApp chaos. No 30-day-stale Tally files.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-accent-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-accent-500/25 transition hover:bg-accent-600"
            >
              Start free
            </Link>
            <a
              href="#how-it-works"
              className="rounded-lg border border-white/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
            >
              See how it works
            </a>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-white/50">
            <span>Pharma ancillaries</span>
            <span>Auto components</span>
            <span>Food processing</span>
            <span>Textiles</span>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-b border-neutral-100 bg-neutral-50 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-600">The problem</h2>
          <p className="mt-4 text-2xl font-bold text-brand-900 sm:text-3xl">
            Your factory runs on WhatsApp, diaries, and one person&apos;s memory
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 text-left sm:grid-cols-2">
            {[
              'Orders tracked on WhatsApp — no visibility once inside the factory',
              'Departments don\'t coordinate — owner is the only connector',
              'Attendance disputes between factory and agency every month',
              'CA sees books 30 days late — works from stale Tally files',
              'ITC mismatches and GST penalties from manual reconciliation',
              'No idea of real profit per order until it\'s too late',
            ].map((problem) => (
              <div key={problem} className="flex gap-3 rounded-lg border border-neutral-200 bg-white p-4">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-danger-50 text-xs text-danger-600">
                  !
                </div>
                <p className="text-sm text-neutral-700">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-600">Features</h2>
            <p className="mt-4 text-2xl font-bold text-brand-900 sm:text-3xl">
              Everything a manufacturing business needs
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-brand-200 hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-lg font-bold text-brand-700">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-brand-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three roles */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-600">Three portals, one platform</h2>
            <p className="mt-4 text-2xl font-bold text-brand-900 sm:text-3xl">
              Built for every stakeholder in the manufacturing chain
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {ROLES.map((role) => (
              <div key={role.title} className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                <div className={`${role.color} px-6 py-5 text-white`}>
                  <h3 className="text-xl font-bold">{role.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{role.subtitle}</p>
                </div>
                <ul className="space-y-3 p-6">
                  {role.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-neutral-700">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success-50 text-xs text-success-600">
                        &#10003;
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-600">How it works</h2>
            <p className="mt-4 text-2xl font-bold text-brand-900 sm:text-3xl">
              Up and running in 10 minutes
            </p>
          </div>
          <div className="mt-12 space-y-8">
            {STEPS.map((s) => (
              <div key={s.step} className="flex gap-6 rounded-xl border border-neutral-200 bg-white p-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-900 text-lg font-bold text-white">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-900">{s.title}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-900 py-20 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Stop running your factory on WhatsApp
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
            Join manufacturers across Hyderabad who are getting real-time visibility into their
            operations and letting their books write themselves.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-lg bg-accent-500 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-accent-500/25 transition hover:bg-accent-600"
          >
            Get started free
          </Link>
          <p className="mt-4 text-sm text-white/40">No credit card required. Free plan available.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-neutral-500">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-900 text-xs font-bold text-white">
              F
            </div>
            <span className="font-semibold text-brand-900">FactoryOS</span>
          </div>
          <p>Built for Indian manufacturing. All amounts in INR. GST compliant.</p>
        </div>
      </footer>
    </main>
  );
}
