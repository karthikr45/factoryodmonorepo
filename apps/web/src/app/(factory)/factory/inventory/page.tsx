'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatINR } from '@/lib/utils';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  costPerUnit: number;
}

export default function InventoryPage(): JSX.Element {
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Add item form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [minimumStock, setMinimumStock] = useState('0');
  const [costPerUnit, setCostPerUnit] = useState('');

  // Stock in/out form state
  const [stockAction, setStockAction] = useState<{ id: string; type: 'in' | 'out' } | null>(null);
  const [stockQty, setStockQty] = useState('');
  const [stockReason, setStockReason] = useState('');

  const { data: items, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: () => apiCall<InventoryItem[]>({ url: '/inventory' }),
  });

  const { data: lowStock } = useQuery<InventoryItem[]>({
    queryKey: ['inventory-low-stock'],
    queryFn: () => apiCall<InventoryItem[]>({ url: '/inventory/low-stock' }),
  });

  const addItem = (): void => {
    start(async () => {
      await apiCall({
        url: '/inventory',
        method: 'POST',
        data: {
          name,
          sku,
          unit,
          minimumStock: Number(minimumStock),
          costPerUnit: Math.round(Number(costPerUnit) * 100),
        },
      });
      setToast('Item added');
      setShowForm(false);
      setName(''); setSku(''); setUnit('pcs'); setMinimumStock('0'); setCostPerUnit('');
      qc.invalidateQueries({ queryKey: ['inventory'] });
    });
  };

  const submitStockAction = (): void => {
    if (!stockAction) return;
    start(async () => {
      const endpoint = stockAction.type === 'in' ? '/inventory/stock-in' : '/inventory/stock-out';
      await apiCall({
        url: endpoint,
        method: 'POST',
        data: {
          inventoryItemId: stockAction.id,
          quantity: Number(stockQty),
          reason: stockReason || undefined,
        },
      });
      setToast(`Stock ${stockAction.type === 'in' ? 'added' : 'removed'} successfully`);
      setStockAction(null);
      setStockQty(''); setStockReason('');
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['inventory-low-stock'] });
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Inventory</h1>
          <p className="mt-1 text-neutral-600">Manage raw materials and finished goods</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add item</Button>
      </div>

      {toast && (
        <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">
          {toast}
        </div>
      )}

      {/* Low stock alerts */}
      {(lowStock ?? []).length > 0 && (
        <div className="mt-4 rounded-lg border border-danger-200 bg-danger-50 p-4">
          <h2 className="text-sm font-semibold text-danger-700">Low stock alerts</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(lowStock ?? []).map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 rounded-full bg-danger-100 px-3 py-1 text-xs font-medium text-danger-800"
              >
                {item.name}
                <span className="text-danger-600">
                  ({item.currentStock}/{item.minimumStock} {item.unit})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add item form */}
      {showForm && (
        <div className="mt-6 max-w-lg rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-brand-900">New inventory item</h2>
          <div className="mt-4 space-y-4">
            <input
              placeholder="Item name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <input
              placeholder="SKU (e.g. RM-001)"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                placeholder="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <input
                placeholder="Min stock"
                type="number"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <input
                placeholder="Cost/unit (Rs)"
                type="number"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addItem} disabled={pending || !name || !sku}>
                {pending ? 'Saving...' : 'Add item'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Stock in/out modal */}
      {stockAction && (
        <div className="mt-6 max-w-lg rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-brand-900">
            Stock {stockAction.type === 'in' ? 'In' : 'Out'}
          </h2>
          <div className="mt-4 space-y-4">
            <input
              placeholder="Quantity"
              type="number"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <input
              placeholder="Reason (optional)"
              value={stockReason}
              onChange={(e) => setStockReason(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <div className="flex gap-2">
              <Button onClick={submitStockAction} disabled={pending || !stockQty}>
                {pending ? 'Processing...' : `Confirm stock ${stockAction.type}`}
              </Button>
              <Button variant="outline" onClick={() => setStockAction(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory table */}
      {isLoading ? (
        <div className="mt-12 text-center text-neutral-500">Loading...</div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium text-right">Current stock</th>
                <th className="px-4 py-3 font-medium text-right">Min stock</th>
                <th className="px-4 py-3 font-medium text-right">Cost/unit</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(items ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-neutral-500">
                    No inventory items yet. Add your first item above.
                  </td>
                </tr>
              ) : (
                (items ?? []).map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{item.sku}</td>
                    <td className="px-4 py-3">{item.unit}</td>
                    <td className="px-4 py-3 text-right font-semibold">{item.currentStock}</td>
                    <td className="px-4 py-3 text-right text-neutral-500">{item.minimumStock}</td>
                    <td className="px-4 py-3 text-right">{formatINR(item.costPerUnit)}</td>
                    <td className="px-4 py-3">
                      {item.currentStock <= item.minimumStock ? (
                        <span className="rounded-full bg-danger-50 px-2 py-0.5 text-xs font-semibold text-danger-700">
                          Low stock
                        </span>
                      ) : (
                        <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-700">
                          In stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStockAction({ id: item.id, type: 'in' })}
                        >
                          Stock In
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStockAction({ id: item.id, type: 'out' })}
                        >
                          Stock Out
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
