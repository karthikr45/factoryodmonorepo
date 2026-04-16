'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';

interface LookupResponse {
  order: {
    number: string;
    productName: string;
    quantity: number;
    unit: string;
    status: string;
    placedOn: string;
    deliveryDate: string;
    totalRupees: number;
    paidRupees: number;
    orgName: string;
  };
  dispatch: { dispatchedOn: string | null; vehicleNumber: string | null; transporter: string | null };
  invoice: { number: string; date: string; pdfUrl: string; totalRupees: number; paidRupees: number; status: string } | null;
  quotation: { number: string; pdfUrl: string } | null;
}

const STAGES = [
  { key: 'ENQUIRY', label: 'Enquiry' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'IN_PRODUCTION', label: 'In production' },
  { key: 'QUALITY_CHECK', label: 'Quality check' },
  { key: 'READY', label: 'Ready' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'DELIVERED', label: 'Delivered' },
];

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function TrackPage(): JSX.Element {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [data, setData] = useState<LookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const lookup = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setError(null); setData(null);
    start(async () => {
      try {
        const url = `${apiUrl}/api/customer-portal/lookup?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`;
        const res = await fetch(url);
        const body = await res.json();
        if (!res.ok || body?.success === false) {
          throw new Error(body?.error?.message ?? 'Order not found');
        }
        setData(body.data ?? body);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lookup failed');
      }
    });
  };

  const stageIdx = data ? Math.max(0, STAGES.findIndex((s) => s.key === data.order.status)) : -1;
  const cancelled = data?.order.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-brand-700">FactoryOS</span>
            <span className="text-sm font-semibold text-brand-900">· Track your order</span>
          </Link>
          <Link href="/contact" className="text-xs text-brand-700 hover:underline">Need help?</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 sm:p-8">
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Where&rsquo;s my order?</h1>
        <p className="mt-1 text-neutral-600">Enter the order number and the phone you placed the order with.</p>

        <form onSubmit={lookup} className="mt-6 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:p-6">
          <input
            placeholder="Order number (e.g. PO-2026-0001)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <input
            placeholder="Phone (with or without +91)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <Button type="submit" disabled={pending}>{pending ? 'Looking up…' : 'Track'}</Button>
        </form>

        {error && (
          <div className="mt-4 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>
        )}

        {data && (
          <div className="mt-6 space-y-4">
            <section className="rounded-2xl border border-brand-200 bg-white p-5">
              <div className="text-xs uppercase tracking-wider text-brand-700">Order</div>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-bold text-brand-900">{data.order.number}</h2>
                <span className="text-sm text-neutral-600">from {data.order.orgName}</span>
              </div>
              <div className="mt-2 text-sm text-neutral-700">
                {data.order.quantity} {data.order.unit} · {data.order.productName}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                Placed {new Date(data.order.placedOn).toLocaleDateString('en-IN')} · Promised by {new Date(data.order.deliveryDate).toLocaleDateString('en-IN')}
              </div>
            </section>

            {/* Progress timeline */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="text-xs uppercase tracking-wider text-brand-700">Status</div>
              {cancelled ? (
                <div className="mt-3 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">Order cancelled</div>
              ) : (
                <ol className="mt-4 space-y-2">
                  {STAGES.map((s, i) => {
                    const done = i <= stageIdx;
                    const current = i === stageIdx;
                    return (
                      <li key={s.key} className="flex items-center gap-3">
                        <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          done ? 'bg-success-500 text-white' : 'bg-neutral-200 text-neutral-500'
                        }`}>
                          {done ? '✓' : i + 1}
                        </span>
                        <span className={current ? 'font-semibold text-brand-900' : (done ? 'text-neutral-700' : 'text-neutral-400')}>
                          {s.label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}

              {data.dispatch.dispatchedOn && (
                <div className="mt-4 rounded-md bg-brand-50 p-3 text-sm">
                  <div className="font-semibold text-brand-900">Dispatched {new Date(data.dispatch.dispatchedOn).toLocaleString('en-IN')}</div>
                  {data.dispatch.vehicleNumber && (
                    <div className="text-brand-800">Vehicle: {data.dispatch.vehicleNumber}{data.dispatch.transporter ? ` · ${data.dispatch.transporter}` : ''}</div>
                  )}
                </div>
              )}
            </section>

            {/* Invoice / quotation */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="text-xs uppercase tracking-wider text-brand-700">Documents</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {data.invoice ? (
                  <div className="rounded-md border border-neutral-200 p-3">
                    <div className="text-sm font-semibold text-brand-900">Invoice {data.invoice.number}</div>
                    <div className="mt-1 text-xs text-neutral-500">{new Date(data.invoice.date).toLocaleDateString('en-IN')}</div>
                    <div className="mt-1 text-sm">
                      ₹{data.invoice.totalRupees.toLocaleString('en-IN')} · paid ₹{data.invoice.paidRupees.toLocaleString('en-IN')}
                    </div>
                    <a
                      href={`${apiUrl}${data.invoice.pdfUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block rounded-md bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800"
                    >
                      Download PDF
                    </a>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-neutral-200 p-3 text-xs text-neutral-500">
                    No invoice yet — it will appear once the order is dispatched.
                  </div>
                )}
                {data.quotation && (
                  <div className="rounded-md border border-neutral-200 p-3">
                    <div className="text-sm font-semibold text-brand-900">Quotation {data.quotation.number}</div>
                    <a
                      href={`${apiUrl}${data.quotation.pdfUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block rounded-md bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800"
                    >
                      Download PDF
                    </a>
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-neutral-500">
                Total ₹{data.order.totalRupees.toLocaleString('en-IN')} · paid ₹{data.order.paidRupees.toLocaleString('en-IN')}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
