'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatINR, formatIST } from '@/lib/utils';

/* ---------- Types ---------- */

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: { id: string; name: string };
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
  items: InvoiceLineItem[];
  createdAt: string;
}

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  SENT: 'bg-brand-100 text-brand-800',
  PARTIALLY_PAID: 'bg-warning-50 text-warning-700',
  PAID: 'bg-success-50 text-success-700',
  OVERDUE: 'bg-danger-50 text-danger-700',
  CANCELLED: 'bg-danger-50 text-danger-700',
};

/* ---------- Component ---------- */

export default function InvoicesPage(): JSX.Element {
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New invoice form state
  const [customerId, setCustomerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<{ description: string; quantity: string; unit: string; unitPrice: string }[]>([
    { description: '', quantity: '', unit: 'pcs', unitPrice: '' },
  ]);

  // Payment form state
  const [paymentTarget, setPaymentTarget] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentRef, setPaymentRef] = useState('');

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => apiCall<Invoice[]>({ url: '/invoices' }),
  });

  const addLineItem = (): void => {
    setLineItems([...lineItems, { description: '', quantity: '', unit: 'pcs', unitPrice: '' }]);
  };

  const updateLineItem = (index: number, field: string, value: string): void => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value } as typeof lineItems[number];
    setLineItems(updated);
  };

  const removeLineItem = (index: number): void => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const createInvoice = (): void => {
    start(async () => {
      await apiCall({
        url: '/invoices',
        method: 'POST',
        data: {
          customerId,
          dueDate: dueDate || undefined,
          items: lineItems.map((li) => ({
            description: li.description,
            quantity: Number(li.quantity),
            unit: li.unit,
            unitPrice: Math.round(Number(li.unitPrice) * 100),
          })),
        },
      });
      setToast('Invoice created');
      setShowForm(false);
      setCustomerId(''); setDueDate('');
      setLineItems([{ description: '', quantity: '', unit: 'pcs', unitPrice: '' }]);
      qc.invalidateQueries({ queryKey: ['invoices'] });
    });
  };

  const recordPayment = (): void => {
    if (!paymentTarget) return;
    start(async () => {
      await apiCall({
        url: `/invoices/${paymentTarget}/payments`,
        method: 'POST',
        data: {
          amount: Math.round(Number(paymentAmount) * 100),
          method: paymentMethod,
          reference: paymentRef || undefined,
        },
      });
      setToast('Payment recorded');
      setPaymentTarget(null);
      setPaymentAmount(''); setPaymentMethod('BANK_TRANSFER'); setPaymentRef('');
      qc.invalidateQueries({ queryKey: ['invoices'] });
    });
  };

  const inputClass =
    'w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200';

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Invoices</h1>
          <p className="mt-1 text-neutral-600">Manage invoices and track payments</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ New invoice</Button>
      </div>

      {toast && (
        <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">
          {toast}
        </div>
      )}

      {/* New invoice form */}
      {showForm && (
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-brand-900">New invoice</h2>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Customer ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputClass} />
              <input type="date" placeholder="Due date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-700">Line items</h3>
              <div className="mt-2 space-y-3">
                {lineItems.map((li, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      placeholder="Description"
                      value={li.description}
                      onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                      className="flex-[2] rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <input
                      placeholder="Qty"
                      type="number"
                      value={li.quantity}
                      onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                      className="w-20 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <input
                      placeholder="Unit"
                      value={li.unit}
                      onChange={(e) => updateLineItem(idx, 'unit', e.target.value)}
                      className="w-20 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <input
                      placeholder="Price (Rs)"
                      type="number"
                      value={li.unitPrice}
                      onChange={(e) => updateLineItem(idx, 'unitPrice', e.target.value)}
                      className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    {lineItems.length > 1 && (
                      <button onClick={() => removeLineItem(idx)} className="text-sm text-danger-600 hover:text-danger-700">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addLineItem} className="mt-2 text-sm font-medium text-brand-700 hover:text-brand-800">
                + Add line item
              </button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createInvoice}
                disabled={pending || !customerId || lineItems.some((li) => !li.description || !li.quantity || !li.unitPrice)}
              >
                {pending ? 'Creating...' : 'Create invoice'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Record payment form */}
      {paymentTarget && (
        <div className="mt-6 max-w-lg rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-brand-900">Record payment</h2>
          <div className="mt-4 space-y-4">
            <input
              placeholder="Amount (Rs)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className={inputClass}
            />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={inputClass}
            >
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CHEQUE">Cheque</option>
            </select>
            <input
              placeholder="Reference / transaction ID (optional)"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className={inputClass}
            />
            <div className="flex gap-2">
              <Button onClick={recordPayment} disabled={pending || !paymentAmount}>
                {pending ? 'Recording...' : 'Record payment'}
              </Button>
              <Button variant="outline" onClick={() => setPaymentTarget(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoices table */}
      {isLoading ? (
        <div className="mt-12 text-center text-neutral-500">Loading...</div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Paid</th>
                <th className="px-4 py-3 font-medium">Due date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(invoices ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    No invoices yet. Create your first invoice above.
                  </td>
                </tr>
              ) : (
                (invoices ?? []).map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>
                    <td className="px-4 py-3">{inv.customer.name}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatINR(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={inv.paidAmount >= inv.totalAmount ? 'text-success-700' : ''}>
                        {formatINR(inv.paidAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{formatIST(inv.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[inv.status] ?? 'bg-neutral-100 text-neutral-700'}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          PDF
                        </a>
                        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                          <Button size="sm" variant="outline" onClick={() => setPaymentTarget(inv.id)} disabled={pending}>
                            Record payment
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Expanded line items row */}
          {expandedId && (invoices ?? []).some((inv) => inv.id === expandedId) && (
            <div className="border-t border-neutral-100 px-5 py-4">
              <table className="w-full text-sm">
                <thead className="text-left text-neutral-500">
                  <tr>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium text-right">Qty</th>
                    <th className="pb-2 font-medium">Unit</th>
                    <th className="pb-2 font-medium text-right">Unit price</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {(invoices ?? [])
                    .find((inv) => inv.id === expandedId)
                    ?.items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-neutral-500">{item.unit}</td>
                        <td className="py-2 text-right">{formatINR(item.unitPrice)}</td>
                        <td className="py-2 text-right font-semibold">{formatINR(item.amount)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
