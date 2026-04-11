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

interface Props {
  customers: Customer[];
}

export function NewOrderForm({ customers }: Props): JSX.Element {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [addingCustomer, setAddingCustomer] = useState(customers.length === 0);

  const [orderNumber, setOrderNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [totalValueRupees, setTotalValueRupees] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setError(null);

    start(async () => {
      try {
        let finalCustomerId = customerId;
        if (addingCustomer) {
          const c = await apiCall<{ id: string }>({
            url: '/customers',
            method: 'POST',
            data: newCustomer,
          });
          finalCustomerId = c.id;
        }
        const order = await apiCall<{ id: string }>({
          url: '/orders',
          method: 'POST',
          data: {
            customerId: finalCustomerId,
            orderNumber,
            productName,
            quantity: Number(quantity),
            unit,
            deliveryDate: new Date(deliveryDate).toISOString(),
            totalValue: Math.round(Number(totalValueRupees) * 100),
            advancePaid: 0,
            notes: notes || undefined,
          },
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
              placeholder="Customer name"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <input
              required
              placeholder="+919876543210"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
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
