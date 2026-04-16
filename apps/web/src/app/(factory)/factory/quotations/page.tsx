'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatINR, formatIST } from '@/lib/utils';

/* ---------- Types ---------- */

interface Quotation {
  id: string;
  quotationNumber: string;
  customer: { id: string; name: string };
  totalAmount: number;
  status: string;
  validUntil: string;
  items: QuotationLineItem[];
  createdAt: string;
}

interface QuotationLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  SENT: 'bg-brand-100 text-brand-800',
  ACCEPTED: 'bg-success-50 text-success-700',
  REJECTED: 'bg-danger-50 text-danger-700',
  EXPIRED: 'bg-warning-50 text-warning-700',
  CONVERTED: 'bg-accent-100 text-accent-800',
};

/* ---------- Component ---------- */

export default function QuotationsPage(): JSX.Element {
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New quotation form state
  const [customerId, setCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<{ description: string; quantity: string; unit: string; unitPrice: string }[]>([
    { description: '', quantity: '', unit: 'pcs', unitPrice: '' },
  ]);

  const { data: quotations, isLoading } = useQuery<Quotation[]>({
    queryKey: ['quotations'],
    queryFn: () => apiCall<Quotation[]>({ url: '/quotations' }),
  });

  const addLineItem = (): void => {
    setItems([...items, { description: '', quantity: '', unit: 'pcs', unitPrice: '' }]);
  };

  const updateLineItem = (index: number, field: string, value: string): void => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value } as typeof items[number];
    setItems(updated);
  };

  const removeLineItem = (index: number): void => {
    setItems(items.filter((_, i) => i !== index));
  };

  const createQuotation = (): void => {
    start(async () => {
      await apiCall({
        url: '/quotations',
        method: 'POST',
        data: {
          customerId,
          validUntil: validUntil || undefined,
          items: items.map((li) => ({
            description: li.description,
            quantity: Number(li.quantity),
            unit: li.unit,
            unitPrice: Math.round(Number(li.unitPrice) * 100),
          })),
        },
      });
      setToast('Quotation created');
      setShowForm(false);
      setCustomerId(''); setValidUntil('');
      setItems([{ description: '', quantity: '', unit: 'pcs', unitPrice: '' }]);
      qc.invalidateQueries({ queryKey: ['quotations'] });
    });
  };

  const updateStatus = (id: string, status: string): void => {
    start(async () => {
      await apiCall({
        url: `/quotations/${id}/status`,
        method: 'POST',
        data: { status },
      });
      setToast(`Quotation ${status.toLowerCase()}`);
      qc.invalidateQueries({ queryKey: ['quotations'] });
    });
  };

  const convertToOrder = (id: string): void => {
    start(async () => {
      await apiCall({
        url: `/quotations/${id}/convert-to-order`,
        method: 'POST',
      });
      setToast('Quotation converted to order');
      qc.invalidateQueries({ queryKey: ['quotations'] });
    });
  };

  const inputClass =
    'w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200';

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Quotations</h1>
          <p className="mt-1 text-neutral-600">Create and manage customer quotations</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ New quotation</Button>
      </div>

      {toast && (
        <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">
          {toast}
        </div>
      )}

      {/* New quotation form */}
      {showForm && (
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-brand-900">New quotation</h2>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Customer ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputClass} />
              <input type="date" placeholder="Valid until" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputClass} />
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-700">Line items</h3>
              <div className="mt-2 space-y-3">
                {items.map((li, idx) => (
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
                    {items.length > 1 && (
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
                onClick={createQuotation}
                disabled={pending || !customerId || items.some((li) => !li.description || !li.quantity || !li.unitPrice)}
              >
                {pending ? 'Creating...' : 'Create quotation'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Quotations table */}
      {isLoading ? (
        <div className="mt-12 text-center text-neutral-500">Loading...</div>
      ) : (
        <div className="mt-6 space-y-4">
          {(quotations ?? []).length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center text-neutral-500">
              No quotations yet. Create your first quotation above.
            </div>
          ) : (
            (quotations ?? []).map((q) => (
              <div key={q.id} className="rounded-lg border border-neutral-200 bg-white">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-semibold text-brand-900">{q.quotationNumber}</div>
                      <div className="text-sm text-neutral-500">{q.customer.name}</div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[q.status] ?? 'bg-neutral-100 text-neutral-700'}`}>
                      {q.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">{formatINR(q.totalAmount)}</div>
                      <div className="text-xs text-neutral-400">Valid until {formatIST(q.validUntil)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/quotations/${q.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        PDF
                      </a>
                      {q.status === 'DRAFT' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(q.id, 'SENT')} disabled={pending}>
                          Send
                        </Button>
                      )}
                      {q.status === 'SENT' && (
                        <>
                          <Button size="sm" onClick={() => updateStatus(q.id, 'ACCEPTED')} disabled={pending}>
                            Accept
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => updateStatus(q.id, 'REJECTED')} disabled={pending}>
                            Reject
                          </Button>
                        </>
                      )}
                      {q.status === 'ACCEPTED' && (
                        <Button size="sm" onClick={() => convertToOrder(q.id)} disabled={pending}>
                          Convert to order
                        </Button>
                      )}
                      <button
                        onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                        className="ml-1 text-sm font-medium text-brand-700 hover:text-brand-800"
                      >
                        {expandedId === q.id ? 'Hide' : 'Details'}
                      </button>
                    </div>
                  </div>
                </div>

                {expandedId === q.id && (
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
                        {q.items.map((item, i) => (
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
