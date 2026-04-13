'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatINR, formatIST } from '@/lib/utils';

interface Lifecycle {
  order: {
    id: string; orderNumber: string; productName: string; quantity: number;
    unit: string; status: string; deliveryDate: string; totalValue: number;
    advancePaid: number; notes: string | null; createdAt: string;
    customer: { id: string; name: string; phone: string; gstin: string | null };
  };
  quotation: { id: string; quotationNumber: string; status: string; totalAmount: number; validUntil: string } | null;
  jobCards: Array<{
    id: string; status: string;
    department: { id: string; name: string; sequence: number };
    startedAt: string | null; completedAt: string | null;
  }>;
  qualityChecks: Array<{ id: string; status: string; defectNotes: string | null; inspectedAt: string | null }>;
  dispatches: Array<{
    id: string; vehicleNumber: string | null; driverName: string | null;
    ewayBillNumber: string | null; dispatchDate: string; deliveredAt: string | null; status: string;
  }>;
  invoice: {
    id: string; invoiceNumber: string; status: string;
    totalAmount: number; paidAmount: number; invoiceDate: string; dueDate: string | null;
  } | null;
  nextAction: { label: string; type: string } | null;
}

const STAGES = [
  { key: 'ENQUIRY', label: 'Enquiry', desc: 'New customer enquiry received' },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Order confirmed, ready to start' },
  { key: 'IN_PRODUCTION', label: 'In Production', desc: 'Moving through departments' },
  { key: 'QUALITY_CHECK', label: 'Quality Check', desc: 'Inspection in progress' },
  { key: 'READY', label: 'Ready', desc: 'Production complete, ready to dispatch' },
  { key: 'DISPATCHED', label: 'Dispatched', desc: 'On the way to customer' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Received by customer' },
];

export default function OrderLifecyclePage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const [showDispatch, setShowDispatch] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('+91');
  const [ewayBill, setEwayBill] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  const { data, isLoading, refetch } = useQuery<Lifecycle>({
    queryKey: ['order-lifecycle', params.id],
    queryFn: () => apiCall<Lifecycle>({ url: `/orders/${params.id}/lifecycle` }),
  });

  const transition = (status: string): void => {
    start(async () => {
      try {
        await apiCall({ url: `/orders/${params.id}/status`, method: 'POST', data: { status } });
        setToast(`Moved to ${status.replace('_', ' ')}`);
        void refetch();
        qc.invalidateQueries({ queryKey: ['dashboard'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  const generateJobCards = (): void => {
    start(async () => {
      try {
        await apiCall({ url: '/production/job-cards', method: 'POST', data: { orderId: params.id } });
        setToast('Job cards generated for all departments');
        void refetch();
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  const updateJobCardStatus = (jobCardId: string, status: string): void => {
    start(async () => {
      try {
        await apiCall({ url: `/production/job-cards/${jobCardId}/status`, method: 'POST', data: { status } });
        setToast(`Job card ${status.replace('_', ' ').toLowerCase()}`);
        void refetch();
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  const runQC = (result: 'PASSED' | 'FAILED' | 'REWORK'): void => {
    start(async () => {
      try {
        const qcRecord = await apiCall<{ id: string }>({
          url: '/quality-check', method: 'POST',
          data: {
            orderId: params.id,
            checklistItems: [
              { parameter: 'Dimensional accuracy', expected: 'As per drawing', actual: 'OK', passed: result !== 'FAILED' },
              { parameter: 'Surface finish', expected: 'Ra 3.2', actual: 'OK', passed: result !== 'FAILED' },
              { parameter: 'Count verification', expected: `${data?.order.quantity} ${data?.order.unit}`, actual: `${data?.order.quantity} ${data?.order.unit}`, passed: true },
            ],
          },
        });
        await apiCall({ url: `/quality-check/${qcRecord.id}/status`, method: 'POST', data: { status: result } });
        setToast(`Quality check ${result.toLowerCase()}`);
        void refetch();
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  const createDispatch = (): void => {
    start(async () => {
      try {
        await apiCall({
          url: '/transport/dispatches', method: 'POST',
          data: { orderId: params.id, vehicleNumber: vehicleNo, driverName, driverPhone, ewayBillNumber: ewayBill },
        });
        await apiCall({ url: `/orders/${params.id}/status`, method: 'POST', data: { status: 'DISPATCHED' } });
        setToast('Dispatched. Invoice auto-generated.');
        setShowDispatch(false);
        setVehicleNo(''); setDriverName(''); setDriverPhone('+91'); setEwayBill('');
        void refetch();
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  const recordPayment = (): void => {
    if (!data?.invoice) return;
    start(async () => {
      try {
        await apiCall({
          url: `/invoices/${data.invoice!.id}/payment`, method: 'POST',
          data: { amountPaise: Math.round(Number(paymentAmount) * 100) },
        });
        setToast('Payment recorded. Journal entry posted.');
        setShowPayment(false);
        setPaymentAmount('');
        void refetch();
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  if (isLoading) return <div className="text-neutral-500">Loading...</div>;
  if (!data) return <div className="text-danger-700">Order not found</div>;

  const currentStageIdx = STAGES.findIndex((s) => s.key === data.order.status);
  const outstanding = data.order.totalValue - data.order.advancePaid;

  return (
    <div className="space-y-6">
      <Link href="/factory/orders" className="text-sm text-brand-700 hover:underline">← Back to orders</Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">{data.order.orderNumber}</h1>
          <p className="mt-1 text-neutral-600">
            {data.order.customer.name} · {data.order.productName} · {data.order.quantity} {data.order.unit}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Delivery by {formatIST(data.order.deliveryDate).split(',')[0]}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase text-neutral-500">Total value</div>
          <div className="text-2xl font-bold text-brand-900">{formatINR(data.order.totalValue)}</div>
          {outstanding > 0 && <div className="text-sm text-accent-600">{formatINR(outstanding)} outstanding</div>}
        </div>
      </div>

      {/* Next action banner */}
      {data.nextAction && (
        <div className="rounded-lg border border-brand-300 bg-brand-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-brand-700">Next action</div>
              <div className="mt-1 text-lg font-semibold text-brand-900">{data.nextAction.label}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.nextAction.type === 'CREATE_QUOTATION' && (
                <Button onClick={() => transition('CONFIRMED')} disabled={pending}>Confirm order</Button>
              )}
              {data.nextAction.type === 'GENERATE_JOB_CARDS' && (
                <Button onClick={generateJobCards} disabled={pending}>Generate job cards</Button>
              )}
              {data.nextAction.type === 'START_PRODUCTION' && (
                <Button onClick={() => transition('IN_PRODUCTION')} disabled={pending}>Start production</Button>
              )}
              {data.nextAction.type === 'QUALITY_CHECK' && (
                <>
                  <Button onClick={() => runQC('PASSED')} disabled={pending}>QC Pass</Button>
                  <Button variant="danger" onClick={() => runQC('FAILED')} disabled={pending}>QC Fail</Button>
                  <Button variant="outline" onClick={() => runQC('REWORK')} disabled={pending}>Rework</Button>
                </>
              )}
              {data.nextAction.type === 'WORK_JOB_CARDS' && (
                <Button onClick={() => transition('QUALITY_CHECK')} disabled={pending} variant="outline">Skip to QC</Button>
              )}
              {data.nextAction.type === 'DISPATCH' && (
                <Button onClick={() => setShowDispatch(true)}>Dispatch order</Button>
              )}
              {data.nextAction.type === 'DELIVERED' && (
                <Button onClick={() => transition('DELIVERED')} disabled={pending}>Mark delivered</Button>
              )}
              {data.nextAction.type === 'RECORD_PAYMENT' && (
                <Button onClick={() => setShowPayment(true)}>Record payment</Button>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">{toast}</div>}

      {/* Timeline */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Order timeline</h2>
        <ol className="mt-4 space-y-4">
          {STAGES.map((stage, idx) => {
            const isPast = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            const isFuture = idx > currentStageIdx;
            return (
              <li key={stage.key} className="flex gap-4">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isPast ? 'bg-success-500 text-white'
                    : isCurrent ? 'bg-brand-700 text-white ring-4 ring-brand-100'
                    : 'bg-neutral-200 text-neutral-500'
                }`}>
                  {isPast ? '✓' : idx + 1}
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${isCurrent ? 'text-brand-900' : isFuture ? 'text-neutral-400' : 'text-neutral-700'}`}>
                    {stage.label}
                  </div>
                  <div className={`text-sm ${isFuture ? 'text-neutral-400' : 'text-neutral-600'}`}>{stage.desc}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Customer info */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Customer</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs text-neutral-500">Name</div>
            <div className="font-medium">{data.order.customer.name}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Phone</div>
            <div className="font-medium">{data.order.customer.phone}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">GSTIN</div>
            <div className="font-mono text-sm">{data.order.customer.gstin ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Job cards */}
      {data.jobCards.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Production ({data.jobCards.filter((jc) => jc.status === 'COMPLETED').length}/{data.jobCards.length} done)
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {data.jobCards.map((jc) => (
              <div key={jc.id} className={`rounded-lg border p-3 ${
                jc.status === 'COMPLETED' ? 'border-success-200 bg-success-50'
                  : jc.status === 'IN_PROGRESS' ? 'border-warning-200 bg-warning-50'
                  : 'border-neutral-200 bg-neutral-50'
              }`}>
                <div className="text-xs text-neutral-500">Stage {jc.department.sequence}</div>
                <div className="font-semibold text-sm">{jc.department.name}</div>
                <div className="mt-1 text-xs font-medium">{jc.status.replace('_', ' ')}</div>
                {jc.status === 'PENDING' && data.order.status === 'IN_PRODUCTION' && (
                  <button onClick={() => updateJobCardStatus(jc.id, 'IN_PROGRESS')} className="mt-2 text-xs font-semibold text-brand-700 hover:underline">
                    Start
                  </button>
                )}
                {jc.status === 'IN_PROGRESS' && (
                  <button onClick={() => updateJobCardStatus(jc.id, 'COMPLETED')} className="mt-2 text-xs font-semibold text-success-700 hover:underline">
                    Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality checks */}
      {data.qualityChecks.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Quality inspections</h2>
          <div className="mt-3 space-y-2">
            {data.qualityChecks.map((qc) => (
              <div key={qc.id} className="flex items-center justify-between rounded border border-neutral-100 px-3 py-2 text-sm">
                <div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    qc.status === 'PASSED' ? 'bg-success-50 text-success-700'
                      : qc.status === 'FAILED' ? 'bg-danger-50 text-danger-700'
                      : 'bg-warning-50 text-warning-700'
                  }`}>{qc.status}</span>
                  {qc.inspectedAt && <span className="ml-2 text-neutral-500">{formatIST(qc.inspectedAt)}</span>}
                </div>
                {qc.defectNotes && <span className="text-xs text-danger-600">{qc.defectNotes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispatch */}
      {data.dispatches.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Dispatch</h2>
          {data.dispatches.map((d) => (
            <div key={d.id} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div><div className="text-xs text-neutral-500">Vehicle</div><div className="font-medium">{d.vehicleNumber ?? '—'}</div></div>
              <div><div className="text-xs text-neutral-500">Driver</div><div className="font-medium">{d.driverName ?? '—'}</div></div>
              <div><div className="text-xs text-neutral-500">E-way bill</div><div className="font-mono text-sm">{d.ewayBillNumber ?? '—'}</div></div>
              <div><div className="text-xs text-neutral-500">Status</div>
                <div className={`font-semibold ${d.status === 'DELIVERED' ? 'text-success-700' : 'text-brand-700'}`}>{d.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice */}
      {data.invoice && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Invoice</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><div className="text-xs text-neutral-500">Invoice #</div><div className="font-mono font-semibold">{data.invoice.invoiceNumber}</div></div>
            <div><div className="text-xs text-neutral-500">Date</div><div className="font-medium">{formatIST(data.invoice.invoiceDate).split(',')[0]}</div></div>
            <div><div className="text-xs text-neutral-500">Total</div><div className="font-medium">{formatINR(data.invoice.totalAmount)}</div></div>
            <div><div className="text-xs text-neutral-500">Paid</div><div className="font-medium text-success-700">{formatINR(data.invoice.paidAmount)}</div></div>
          </div>
          {data.invoice.status !== 'PAID' && (
            <Button size="sm" className="mt-4" onClick={() => setShowPayment(true)}>Record payment</Button>
          )}
        </div>
      )}

      {/* Dispatch form */}
      {showDispatch && (
        <div className="rounded-lg border border-brand-300 bg-white p-6">
          <h3 className="text-lg font-semibold text-brand-900">Dispatch details</h3>
          <p className="mt-1 text-sm text-neutral-600">Creating a dispatch auto-generates the GST invoice.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <input placeholder="Vehicle number (e.g. TS09EA1234)" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2" />
            <input placeholder="Driver name" value={driverName} onChange={(e) => setDriverName(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2" />
            <input placeholder="+91 driver phone" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2" />
            <input placeholder="E-way bill number" value={ewayBill} onChange={(e) => setEwayBill(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2" />
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={createDispatch} disabled={pending}>Dispatch & generate invoice</Button>
            <Button variant="outline" onClick={() => setShowDispatch(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Payment form */}
      {showPayment && data.invoice && (
        <div className="rounded-lg border border-brand-300 bg-white p-6">
          <h3 className="text-lg font-semibold text-brand-900">Record customer payment</h3>
          <p className="mt-1 text-sm text-neutral-600">
            Outstanding: {formatINR(data.invoice.totalAmount - data.invoice.paidAmount)}
          </p>
          <div className="mt-4 flex gap-3">
            <input type="number" placeholder="Amount in ₹" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2" />
            <Button onClick={recordPayment} disabled={pending || !paymentAmount}>Record</Button>
            <Button variant="outline" onClick={() => setShowPayment(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {data.order.notes && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-neutral-700">{data.order.notes}</p>
        </div>
      )}
    </div>
  );
}
