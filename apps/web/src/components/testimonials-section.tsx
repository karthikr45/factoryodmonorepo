const TESTIMONIALS = [
  {
    quote:
      "Before FactoryOS, I was the only one who knew what was happening in my factory. Now my production manager runs everything and I see real-time updates on my phone. My stress dropped overnight.",
    author: 'Ravi Kumar',
    title: 'Owner, Hyderabad Precision Components',
    initials: 'RK',
    color: 'from-brand-500 to-brand-700',
  },
  {
    quote:
      "Attendance disputes used to take 3 days every month. Now the factory owner approves in one tap and I get paid faster. My workers also trust the numbers.",
    author: 'Suresh Naidu',
    title: 'Founder, Deccan Labour Services',
    initials: 'SN',
    color: 'from-accent-500 to-accent-700',
  },
  {
    quote:
      "I used to chase my factory clients for Tally backups every month. With FactoryOS I already have the data. GSTR-1 drafts generate themselves. My practice scales without hiring more staff.",
    author: 'Lakshmi Reddy, CA',
    title: 'Reddy & Associates',
    initials: 'LR',
    color: 'from-highlight-400 to-highlight-600',
  },
  {
    quote:
      "The profit-per-order report showed me I was losing money on 3 of my big customers. I renegotiated with them and saved ₹4 lakhs last quarter.",
    author: 'Mahesh Rao',
    title: 'MD, Balanagar Components',
    initials: 'MR',
    color: 'from-brand-600 to-highlight-500',
  },
];

export function TestimonialsSection(): JSX.Element {
  return (
    <section className="relative overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="inline-block rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-700">
            Loved by Hyderabad factories
          </div>
          <h2 className="mt-4 text-4xl font-bold text-brand-900 sm:text-5xl">
            Don&apos;t take our word for it
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Factory owners, staffing agencies, and CAs who switched to FactoryOS.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.author}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-600/10"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Quote mark */}
              <div className="absolute -top-4 -right-4 text-9xl font-serif text-brand-100 transition-colors group-hover:text-brand-200">
                &ldquo;
              </div>

              <div className="relative">
                <p className="text-lg leading-relaxed text-neutral-800">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-sm font-bold text-white shadow-md`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-brand-900">{t.author}</div>
                    <div className="text-sm text-neutral-500">{t.title}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
