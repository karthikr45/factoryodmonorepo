'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatINR } from '@/lib/utils';

interface Vendor {
  id: string;
  name: string;
  phone: string;
  gstin: string | null;
  totalOrders: number;
}

interface PO {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  gstAmount: number;
  vendor: { id: string; name: string };
  expectedDate: string | null;
  receivedDate: string | null;
}

export default function ProcurementPage(): JSX.Element {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'orders' | 'vendors' | 'new-vendor' | 'new-po'>('orders');
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  // Vendor form state
  const [vName, setVName] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vGstin, setVGstin] = useState('');

  // PO form state
  const [poVendor, setPoVendor] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [poDesc, setPoDesc] = useState('');
  const [poQty, setPoQty] = useState('1');
  const [poUnit, setPoUnit] = useState('pcs');
  const [poPrice, setPoPrice] = useState('');
  const [poGstRate, setPoGstRate] = useState('18');

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ['vendors'],
    queryFn: () => apiCall<Vendor[]>({ url: '/procurement/vendors' }),
  });

  const { data: pos } = useQuery<PO[]>({
    queryKey: ['purchase-orders'],
    queryFn: () => apiCall<PO[]>({ url: '/procurement/purchase-orders' }),
  });

  const createVendor = (): void => {
    start(async () => {
      await apiCall({ url: '/procurement/vendors', method: 'POST', data: { name: vName, phone: vPhone, gstin: vGstin || undefined } });
      setToast('Vendor created');
      setTab('vendors');
      setVName(''); setVPhone(''); setVGstin('');
      qc.invalidateQueries({ queryKey: ['vendors'] });
    });
  };

  const createPO = (): void => {
    start(async () => {
      await apiCall({
        url: '/procurement/purchase-orders', method: 'POST',
        data: {
          vendorId: poVendor, poNumber,
          items: [{ description: poDesc, quantity: Number(poQty), unit: poUnit, unitPrice: Math.round(Number(poPrice) * 100), gstRate: Number(poGstRate) }],
        },
      });
      setToast('Purchase order created');
      setTab('orders');
      setPoNumber(''); setPoDesc(''); setPoQty('1'); setPoPrice('');
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
    });
  };

  const markReceived = (id: string): void => {
    start(async () => {
      await apiCall({ url: `/procurement/purchase-orders/${id}/status`, method: 'PATCH', data: { status: 'RECEIVED' } });
      setToast('GRN recorded - inventory and GST auto-posted');
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Procurement</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTab('new-vendor')}>+ Vendor</Button>
          <Button onClick={() => setTab('new-po')}>+ Purchase Order</Button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {(['orders', 'vendors'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${tab === t ? 'border-brand-700 bg-brand-700 text-white' : 'border-neutral-200'}`}
          >
            {t === 'orders' ? 'Purchase Orders' : 'Vendors'}
          </button>
        ))}
      </div>

      {toast && <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">{toast}</div>}

      {/* Vendors tab */}
      {tab === 'vendors' && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left"><tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">GSTIN</th>
              <th className="px-4 py-3 font-medium">Orders</th>
            </tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {(vendors ?? []).length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-neutral-500">No vendors yet</td></tr>
              ) : (vendors ?? []).map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3 font-medium">{v.name}</td>
                  <td className="px-4 py-3">{v.phone}</td>
                  <td className="px-4 py-3 font-mono text-xs">{v.gstin ?? '—'}</td>
                  <td className="px-4 py-3">{v.totalOrders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Purchase Orders tab */}
      {tab === 'orders' && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left"><tr>
              <th className="px-4 py-3 font-medium">PO #</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">GST</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {(pos ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-500">No purchase orders yet</td></tr>
              ) : (pos ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono font-semibold">{p.poNumber}</td>
                  <td className="px-4 py-3">{p.vendor.name}</td>
                  <td className="px-4 py-3">{formatINR(p.totalAmount)}</td>
                  <td className="px-4 py-3">{formatINR(p.gstAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.status === 'RECEIVED' ? 'bg-success-50 text-success-700'
                        : p.status === 'SENT' ? 'bg-brand-100 text-brand-800'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status !== 'RECEIVED' && p.status !== 'CANCELLED' && (
                      <Button size="sm" onClick={() => markReceived(p.id)} disabled={pending}>
                        Mark received
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New vendor form */}
      {tab === 'new-vendor' && (
        <div className="mt-6 max-w-lg rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-brand-900">New vendor</h2>
          <div className="mt-4 space-y-4">
            <input placeholder="Vendor name" value={vName} onChange={(e) => setVName(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <input placeholder="+919876543210" value={vPhone} onChange={(e) => setVPhone(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <input placeholder="GSTIN (optional)" value={vGstin} onChange={(e) => setVGstin(e.target.value.toUpperCase())}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 uppercase focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <div className="flex gap-2">
              <Button onClick={createVendor} disabled={pending || !vName || !vPhone}>{pending ? 'Saving...' : 'Create vendor'}</Button>
              <Button variant="outline" onClick={() => setTab('vendors')}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* New PO form */}
      {tab === 'new-po' && (
        <div className="mt-6 max-w-lg rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-brand-900">New purchase order</h2>
          <div className="mt-4 space-y-4">
            <select value={poVendor} onChange={(e) => setPoVendor(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200">
              <option value="">Select vendor</option>
              {(vendors ?? []).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <input placeholder="PO Number (e.g. PO-001)" value={poNumber} onChange={(e) => setPoNumber(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <input placeholder="Item description" value={poDesc} onChange={(e) => setPoDesc(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <div className="grid grid-cols-3 gap-3">
              <input placeholder="Qty" type="number" value={poQty} onChange={(e) => setPoQty(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
              <input placeholder="Unit" value={poUnit} onChange={(e) => setPoUnit(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
              <input placeholder="Unit price (Rs)" type="number" value={poPrice} onChange={(e) => setPoPrice(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <select value={poGstRate} onChange={(e) => setPoGstRate(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200">
              <option value="0">0% GST</option>
              <option value="5">5% GST</option>
              <option value="12">12% GST</option>
              <option value="18">18% GST</option>
              <option value="28">28% GST</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={createPO} disabled={pending || !poVendor || !poNumber || !poDesc || !poPrice}>{pending ? 'Creating...' : 'Create PO'}</Button>
              <Button variant="outline" onClick={() => setTab('orders')}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
