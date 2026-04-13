'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: 'Do I need to stop using Tally right away?',
    a: "No. FactoryOS works alongside Tally. Your journal entries generate automatically — you can export them to Tally any time. Most of our customers stop using Tally within 3 months because there's nothing left to do there.",
  },
  {
    q: 'What if my staff has low digital literacy?',
    a: "FactoryOS is designed for that reality. Workers use big buttons on their phone — one tap to check in, one tap to mark a job card done. Floor managers don't need to type anything. The interface works for Hyderabad factory floors.",
  },
  {
    q: 'How is GST handled?',
    a: "Every dispatched order automatically calculates GST, creates a tax invoice, and posts the output GST entry. Every received purchase posts input GST. GSTR-1 and GSTR-3B draft themselves from your actual transactions — no spreadsheet reconciliation.",
  },
  {
    q: 'What about my CA — will they use this?',
    a: "Your CA gets their own portal. They see your books live, generate GST returns, and raise queries through the app. Most CAs love it because they can serve more clients without hiring more staff. You invite them during onboarding.",
  },
  {
    q: 'What does it cost?',
    a: 'The Free plan supports up to 20 workers and 50 orders per month — enough for most small factories to get started. The Pro plan at ₹2,999/month unlocks unlimited workers, unlimited orders, advanced reports, and WhatsApp integration.',
  },
  {
    q: 'Will my data be safe?',
    a: 'Every query in FactoryOS is automatically scoped to your organisation. No other factory can ever see your data. We use Postgres with row-level security and JWT authentication. Your GST and financial data is encrypted at rest.',
  },
  {
    q: 'How long does onboarding take?',
    a: '60 seconds to sign up. About 10 minutes to invite your team and connect your CA/agency. Your first order can be tracked on day 1. Most factories are fully operational within a week.',
  },
  {
    q: 'What if I need help?',
    a: "We provide WhatsApp support on the Pro plan and a detailed help center for everyone. Pilot customers in Hyderabad get a dedicated onboarding call. Our engineering team is based in India — we understand the manufacturing landscape.",
  },
];

export function FAQSection(): JSX.Element {
  const [open, setOpen] = useState<number>(0);

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
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`overflow-hidden rounded-2xl border bg-white transition-all ${
                  isOpen ? 'border-brand-300 shadow-lg shadow-brand-600/10' : 'border-neutral-200 hover:border-brand-200'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <span className={`font-semibold transition-colors ${isOpen ? 'text-brand-900' : 'text-neutral-800'}`}>
                    {item.q}
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
                    <p className="border-t border-neutral-100 p-5 text-neutral-700">{item.a}</p>
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
