'use client';

import { useEffect, useState } from 'react';

interface Testimonial {
  id: string;
  author: string;
  title: string | null;
  quote: string;
  initials: string | null;
  colorFrom: string | null;
  colorTo: string | null;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function TestimonialsSection(): JSX.Element {
  const [data, setData] = useState<Testimonial[] | null>(null);

  useEffect(() => {
    void fetch(`${apiUrl}/api/content/testimonials`)
      .then((r) => r.json())
      .then((j) => setData(j?.data ?? []))
      .catch(() => setData([]));
  }, []);

  if (data && data.length === 0) return <></>; // no section if no testimonials yet

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
          {(data ?? Array(4).fill(null)).map((t, i) => (
            <div
              key={t?.id ?? i}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-600/10"
            >
              <div className="absolute -top-4 -right-4 text-9xl font-serif text-brand-100 transition-colors group-hover:text-brand-200">
                &ldquo;
              </div>
              {t === null ? (
                <div className="relative animate-pulse">
                  <div className="h-4 w-3/4 rounded bg-neutral-100" />
                  <div className="mt-2 h-4 w-full rounded bg-neutral-100" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-neutral-100" />
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-neutral-100" />
                    <div className="space-y-2">
                      <div className="h-3 w-24 rounded bg-neutral-100" />
                      <div className="h-3 w-32 rounded bg-neutral-100" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <p className="text-lg leading-relaxed text-neutral-800">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
                      style={{ background: `linear-gradient(135deg, ${t.colorFrom ?? '#562F54'}, ${t.colorTo ?? '#8DF688'})` }}
                    >
                      {t.initials ?? t.author.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-brand-900">{t.author}</div>
                      <div className="text-sm text-neutral-500">{t.title}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
