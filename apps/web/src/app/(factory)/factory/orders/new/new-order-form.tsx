'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  industry: string;
  isDefault: boolean;
}

interface Props {
  customers: Customer[];
  workflows?: WorkflowTemplate[];
}

/** Normalize various phone inputs to +91XXXXXXXXXX */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return raw;
}

export function NewOrderForm({ customers, workflows = [] }: Props): JSX.Element {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', gstin: '' });
  const [addingCustomer, setAddingCustomer] = useState(customers.length === 0);

  const [orderNumber, setOrderNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [totalValueRupees, setTotalValueRupees] = useState('');
  const [notes, setNotes] = useState('');
  const [workflowTemplateId, setWorkflowTemplateId] = useState<string>(
    workflows.find((w) => w.isDefault)?.id ?? '',
  );

  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setError(null);

    // Client-side validation upfront — gives faster feedback than a server roundtrip
    if (!orderNumber.trim()) { setError('Order number is required'); return; }
    if (!productName.trim()) { setError('Product / work description is required'); return; }
    if (!quantity || Number(quantity) <= 0) { setError('Quantity must be greater than 0'); return; }
    if (!deliveryDate) { setError('Delivery date is required'); return; }
    if (!totalValueRupees || Number(totalValueRupees) <= 0) { setError('Total value must be greater than 0'); return; }

    if (addingCustomer) {
      if (!newCustomer.name.trim() || newCustomer.name.trim().length < 2) {
        setError('Customer name must be at least 2 characters'); return;
      }
      const phone = normalizePhone(newCustomer.phone);
      if (!/^\+91[6-9]\d{9}$/.test(phone)) {
        setError('Phone must be a valid Indian mobile number (10 digits starting with 6/7/8/9)');
        return;
      }
    } else if (!customerId) {
      setError('Pick a customer or add a new one'); return;
    }

    start(async () => {
      try {
        const payload: Record<string, unknown> = {
          orderNumber: orderNumber.trim(),
          productName: productName.trim(),
          quantity: Number(quantity),
          unit,
          deliveryDate: new Date(deliveryDate).toISOString(),
          totalValue: Math.round(Number(totalValueRupees) * 100),
          advancePaid: 0,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
          ...(workflowTemplateId ? { workflowTemplateId } : {}),
        };

        if (addingCustomer) {
          payload.customer = {
            name: newCustomer.name.trim(),
            phone: normalizePhone(newCustomer.phone),
            ...(newCustomer.gstin.trim() ? { gstin: newCustomer.gstin.trim().toUpperCase() } : {}),
          };
        } else {
          payload.customerId = customerId;
        }

        // Single atomic call — creates customer (if new) AND order in one transaction.
        const order = await apiCall<{ id: string; customerId: string }>({
          url: '/orders/with-customer',
          method: 'POST',
          data: payload,
        });
        router.push(`/factory/orders/${order.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create order');
      }
    });
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-5">
      {/* Customer section */}
      <fieldset className="rounded-lg border border-neutral-200 p-4">
        <legend className="px-2 text-sm font-semibold text-neutral-700">Customer</legend>
        {!addingCustomer && customers.length > 0 ? (
          <div className="flex gap-2">
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.phone}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setAddingCustomer(true)}
              className="rounded-md border border-brand-200 px-3 py-2 text-sm text-brand-700 hover:bg-brand-50"
            >
              + New
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              required
              placeholder="Customer name (e.g. Tata Motors)"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <input
              required
              placeholder="Phone — 9876543210 or +919876543210"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <input
              placeholder="GSTIN (optional, 15 chars)"
              value={newCustomer.gstin}
              onChange={(e) => setNewCustomer({ ...newCustomer, gstin: e.target.value.toUpperCase() })}
              maxLength={15}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 uppercase focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            {customers.length > 0 ? (
              <button
                type="button"
                onClick={() => setAddingCustomer(false)}
                className="text-sm text-brand-700 hover:underline"
              >
                Pick an existing customer instead
              </button>
            ) : null}
          </div>
        )}
      </fieldset>

      {/* Order details */}
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Order number</span>
          <input
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="PO-2025-0001"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Delivery date</span>
          <input
            required
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Product / work description</span>
        <input
          required
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Quantity</span>
          <input
            required
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Unit</span>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="pcs">pcs</option>
            <option value="kg">kg</option>
            <option value="ton">ton</option>
            <option value="m">metres</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Total value (₹)</span>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={totalValueRupees}
            onChange={(e) => setTotalValueRupees(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </label>
      </div>

      {workflows.length > 0 ? (
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Production workflow</span>
          <select
            value={workflowTemplateId}
            onChange={(e) => setWorkflowTemplateId(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="">Use org default</option>
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
                {w.isDefault ? ' (default)' : ''}
                {w.industry && w.industry !== 'GENERAL' ? ` — ${w.industry}` : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Job cards will be auto-generated once the order is confirmed.
          </p>
        </label>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Notes</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </label>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating...' : 'Create order'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/factory/orders')}
        >
          Cancel
        </Button>
      </div>

      {error ? (
        <div className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {error}
        </div>
      ) : null}
    </form>
  );
}
