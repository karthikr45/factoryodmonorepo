'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatIST } from '@/lib/utils';

/* ---------- Types ---------- */

interface Dispatch {
  id: string;
  orderNumber: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  ewayBillNumber: string | null;
  status: string;
  dispatchedAt: string;
  deliveredAt: string | null;
  order: { id: string; orderNumber: string };
}

interface Transporter {
  id: string;
  name: string;
  phone: string;
  vehicleCount: number;
}

const STATUS_COLOR: Record<string, string> = {
  DISPATCHED: 'bg-brand-100 text-brand-800',
  IN_TRANSIT: 'bg-warning-50 text-warning-700',
  DELIVERED: 'bg-success-50 text-success-700',
  CANCELLED: 'bg-danger-50 text-danger-700',
};

/* ---------- Component ---------- */

export default function TransportPage(): JSX.Element {
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  // Dispatch form
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [dOrderId, setDOrderId] = useState('');
  const [dVehicle, setDVehicle] = useState('');
  const [dDriverName, setDDriverName] = useState('');
  const [dDriverPhone, setDDriverPhone] = useState('');
  const [dEway, setDEway] = useState('');

  // Transporter form
  const [showTransporterForm, setShowTransporterForm] = useState(false);
  const [tName, setTName] = useState('');
  const [tPhone, setTPhone] = useState('');
  const [tVehicleCount, setTVehicleCount] = useState('');

  const { data: dispatches, isLoading: loadingDispatches } = useQuery<Dispatch[]>({
    queryKey: ['dispatches'],
    queryFn: () => apiCall<Dispatch[]>({ url: '/transport/dispatches' }),
  });

  const { data: transporters, isLoading: loadingTransporters } = useQuery<Transporter[]>({
    queryKey: ['transporters'],
    queryFn: () => apiCall<Transporter[]>({ url: '/transport/transporters' }),
  });

  const createDispatch = (): void => {
    start(async () => {
      await apiCall({
        url: '/transport/dispatches',
        method: 'POST',
        data: {
          orderId: dOrderId,
          vehicleNumber: dVehicle,
          driverName: dDriverName,
          driverPhone: dDriverPhone,
          ewayBillNumber: dEway || undefined,
        },
      });
      setToast('Dispatch created');
      setShowDispatchForm(false);
      setDOrderId(''); setDVehicle(''); setDDriverName(''); setDDriverPhone(''); setDEway('');
      qc.invalidateQueries({ queryKey: ['dispatches'] });
    });
  };

  const markDelivered = (id: string): void => {
    start(async () => {
      await apiCall({
        url: `/transport/dispatches/${id}/deliver`,
        method: 'POST',
      });
      setToast('Marked as delivered');
      qc.invalidateQueries({ queryKey: ['dispatches'] });
    });
  };

  const addTransporter = (): void => {
    start(async () => {
      await apiCall({
        url: '/transport/transporters',
        method: 'POST',
        data: {
          name: tName,
          phone: tPhone,
          vehicleCount: Number(tVehicleCount) || 0,
        },
      });
      setToast('Transporter added');
      setShowTransporterForm(false);
      setTName(''); setTPhone(''); setTVehicleCount('');
      qc.invalidateQueries({ queryKey: ['transporters'] });
    });
  };

  const inputClass =
    'w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200';

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Transport &amp; Dispatch</h1>
          <p className="mt-1 text-neutral-600">Manage dispatches, vehicles and transporters</p>
        </div>
        <Button onClick={() => setShowDispatchForm(true)}>+ New dispatch</Button>
      </div>

      {toast && (
        <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">
          {toast}
        </div>
      )}

      {/* New dispatch form */}
      {showDispatchForm && (
        <div className="mt-6 max-w-lg rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-brand-900">New dispatch</h2>
          <div className="mt-4 space-y-4">
            <input placeholder="Order ID" value={dOrderId} onChange={(e) => setDOrderId(e.target.value)} className={inputClass} />
            <input placeholder="Vehicle number" value={dVehicle} onChange={(e) => setDVehicle(e.target.value)} className={inputClass} />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Driver name" value={dDriverName} onChange={(e) => setDDriverName(e.target.value)} className={inputClass} />
              <input placeholder="Driver phone" value={dDriverPhone} onChange={(e) => setDDriverPhone(e.target.value)} className={inputClass} />
            </div>
            <input placeholder="E-way bill number (optional)" value={dEway} onChange={(e) => setDEway(e.target.value)} className={inputClass} />
            <div className="flex gap-2">
              <Button onClick={createDispatch} disabled={pending || !dOrderId || !dVehicle || !dDriverName || !dDriverPhone}>
                {pending ? 'Creating...' : 'Create dispatch'}
              </Button>
              <Button variant="outline" onClick={() => setShowDispatchForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatches table */}
      {loadingDispatches ? (
        <div className="mt-12 text-center text-neutral-500">Loading...</div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3 font-medium">E-way bill</th>
                <th className="px-4 py-3 font-medium">Dispatched</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(dispatches ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    No dispatches yet. Create one to start tracking deliveries.
                  </td>
                </tr>
              ) : (
                (dispatches ?? []).map((d) => (
                  <tr key={d.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-semibold text-brand-700">{d.order.orderNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs">{d.vehicleNumber}</td>
                    <td className="px-4 py-3">
                      {d.driverName}
                      <span className="ml-1 text-neutral-400 text-xs">{d.driverPhone}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{d.ewayBillNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-500">{formatIST(d.dispatchedAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[d.status] ?? 'bg-neutral-100 text-neutral-700'}`}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.status !== 'DELIVERED' && d.status !== 'CANCELLED' && (
                        <Button size="sm" variant="outline" onClick={() => markDelivered(d.id)} disabled={pending}>
                          Mark delivered
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Transporters section */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-900">Transporters</h2>
          <Button size="sm" variant="outline" onClick={() => setShowTransporterForm(true)}>
            + Add transporter
          </Button>
        </div>

        {showTransporterForm && (
          <div className="mt-4 max-w-lg rounded-lg border border-neutral-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-brand-900">New transporter</h3>
            <div className="mt-4 space-y-4">
              <input placeholder="Name" value={tName} onChange={(e) => setTName(e.target.value)} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Phone" value={tPhone} onChange={(e) => setTPhone(e.target.value)} className={inputClass} />
                <input placeholder="Vehicle count" type="number" value={tVehicleCount} onChange={(e) => setTVehicleCount(e.target.value)} className={inputClass} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addTransporter} disabled={pending || !tName || !tPhone}>
                  {pending ? 'Saving...' : 'Add transporter'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowTransporterForm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {loadingTransporters ? (
          <div className="mt-6 text-center text-neutral-500">Loading...</div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium text-right">Vehicles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(transporters ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-neutral-500">
                      No transporters added yet.
                    </td>
                  </tr>
                ) : (
                  (transporters ?? []).map((t) => (
                    <tr key={t.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium">{t.name}</td>
                      <td className="px-4 py-3 text-neutral-500">{t.phone}</td>
                      <td className="px-4 py-3 text-right">{t.vehicleCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
