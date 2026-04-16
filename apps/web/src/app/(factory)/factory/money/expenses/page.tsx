'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatINR, formatIST } from '@/lib/utils';

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amountPaise: number;
  paymentMethod: string;
  vendorName: string | null;
}

const CATEGORIES = ['RENT', 'POWER', 'UTILITIES', 'WAGES', 'FREIGHT', 'OFFICE', 'TRAVEL', 'OTHER'] as const;
const METHODS = ['BANK_TRANSFER', 'CASH', 'UPI', 'CHEQUE', 'CARD'] as const;

export default function ExpensesPage(): JSX.Element {
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: today, category: 'RENT' as typeof CATEGORIES[number], description: '',
    amountRupees: '', paymentMethod: 'BANK_TRANSFER' as typeof METHODS[number],
    vendorName: '', notes: '',
  });

  const { data: list } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: () => apiCall<Expense[]>({ url: '/expenses' }),
  });

  const submit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setToast(null);
    if (!form.description.trim()) { setToast('Description required'); return; }
    if (!form.amountRupees || Number(form.amountRupees) <= 0) { setToast('Amount must be > 0'); return; }
    start(async () => {
      try {
        await apiCall({
          url: '/expenses', method: 'POST',
          data: {
            date: form.date,
            category: form.category,
            description: form.description.trim(),
            amountRupees: Number(form.amountRupees),
            paymentMethod: form.paymentMethod,
            vendorName: form.vendorName.trim() || undefined,
            notes: form.notes.trim() || undefined,
          },
        });
        setToast('Expense recorded');
        setShowForm(false);
        setForm({ ...form, description: '', amountRupees: '', vendorName: '', notes: '' });
        qc.invalidateQueries({ queryKey: ['expenses'] });
      } catch (err) { setToast(err instanceof Error ? err.message : 'Failed'); }
    });
  };

  const total = (list ?? []).reduce((a, e) => a + e.amountPaise, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Expenses</h1>
          <p className="mt-1 text-neutral-600">Capture rent, electricity, travel — everything that isn&rsquo;t a PO.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Record expense</Button>
      </div>

      {toast && <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">{toast}</div>}

      <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-4">
        <div className="text-sm text-brand-700">Total recorded</div>
        <div className="text-2xl font-bold text-brand-900">{formatINR(total)}</div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-brand-900">New expense</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-neutral-700">Date</span>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-neutral-700">Category</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as typeof CATEGORIES[number] })}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-neutral-700">Description</span>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. April rent for shop floor"
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-neutral-700">Amount (₹)</span>
              <input type="number" min="0" step="0.01" value={form.amountRupees}
                onChange={(e) => setForm({ ...form, amountRupees: e.target.value })}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-neutral-700">Payment method</span>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as typeof METHODS[number] })}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
                {METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-neutral-700">Vendor (optional)</span>
              <input value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-neutral-700">Notes</span>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save expense'}</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(list ?? []).length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-500">No expenses recorded yet.</td></tr>
            ) : (list ?? []).map((e) => (
              <tr key={e.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">{formatIST(e.date)}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold">{e.category}</span></td>
                <td className="px-4 py-3">{e.description}</td>
                <td className="px-4 py-3 text-neutral-600">{e.vendorName ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-neutral-500">{e.paymentMethod.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatINR(e.amountPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
