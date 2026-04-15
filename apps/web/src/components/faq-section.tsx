'use client';

import { useEffect, useState } from 'react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function FAQSection(): JSX.Element {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [open, setOpen] = useState<number>(0);

  useEffect(() => {
    void fetch(`${apiUrl}/api/content/faqs`)
      .then((r) => r.json())
      .then((j) => setFaqs(j?.data ?? []))
      .catch(() => setFaqs([]));
  }, []);

  if (faqs.length === 0) return <></>;

  return (
    <section className="relative overflow-hidden bg-neutral-50 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <div className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            Questions
          </div>
          <h2 className="mt-4 text-4xl font-bold text-brand-900 sm:text-5xl">
            Things factory owners ask us
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-2xl border bg-white transition-all ${
                  isOpen ? 'border-brand-300 shadow-lg shadow-brand-600/10' : 'border-neutral-200 hover:border-brand-200'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <span className={`font-semibold transition-colors ${isOpen ? 'text-brand-900' : 'text-neutral-800'}`}>
                    {item.question}
                  </span>
                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                      isOpen ? 'rotate-45 bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-neutral-100 p-5 text-neutral-700">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
