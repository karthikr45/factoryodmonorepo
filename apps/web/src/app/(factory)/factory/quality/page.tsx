'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatIST } from '@/lib/utils';

interface ChecklistItem {
  parameter: string;
  expected: string;
  actual: string;
  passed: boolean;
}

interface QCRecord {
  id: string;
  status: string;
  remarks: string | null;
  checklist: ChecklistItem[];
  order: { id: string; orderNumber: string; productName: string };
  inspector: { id: string; name: string } | null;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-neutral-100 text-neutral-700',
  PASSED: 'bg-success-50 text-success-700',
  FAILED: 'bg-danger-50 text-danger-700',
  REWORK: 'bg-warning-50 text-warning-700',
};

export default function QualityPage(): JSX.Element {
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New QC form state
  const [orderId, setOrderId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { parameter: '', expected: '', actual: '', passed: false },
  ]);

  const { data: records, isLoading } = useQuery<QCRecord[]>({
    queryKey: ['quality-checks'],
    queryFn: () => apiCall<QCRecord[]>({ url: '/quality-check' }),
  });

  const addChecklistRow = (): void => {
    setChecklist([...checklist, { parameter: '', expected: '', actual: '', passed: false }]);
  };

  const updateChecklistRow = (
    index: number,
    field: keyof ChecklistItem,
    value: string | boolean,
  ): void => {
    const updated = [...checklist];
    updated[index] = { ...updated[index], [field]: value } as ChecklistItem;
    setChecklist(updated);
  };

  const removeChecklistRow = (index: number): void => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const createQC = (): void => {
    start(async () => {
      await apiCall({
        url: '/quality-check',
        method: 'POST',
        data: { orderId, remarks: remarks || undefined, checklist },
      });
      setToast('QC record created');
      setShowForm(false);
      setOrderId(''); setRemarks('');
      setChecklist([{ parameter: '', expected: '', actual: '', passed: false }]);
      qc.invalidateQueries({ queryKey: ['quality-checks'] });
    });
  };

  const updateStatus = (id: string, status: string): void => {
    start(async () => {
      await apiCall({
        url: `/quality-check/${id}/status`,
        method: 'POST',
        data: { status },
      });
      setToast(`QC marked as ${status}`);
      qc.invalidateQueries({ queryKey: ['quality-checks'] });
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Quality Check</h1>
          <p className="mt-1 text-neutral-600">Inspect orders before dispatch</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ New QC</Button>
      </div>

      {toast && (
        <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">
          {toast}
        </div>
      )}

      {/* New QC form */}
      {showForm && (
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-brand-900">New quality check</h2>
          <div className="mt-4 space-y-4">
            <input
              placeholder="Order ID"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <input
              placeholder="Remarks (optional)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />

            <div>
              <h3 className="text-sm font-medium text-neutral-700">Checklist items</h3>
              <div className="mt-2 space-y-3">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      placeholder="Parameter"
                      value={item.parameter}
                      onChange={(e) => updateChecklistRow(idx, 'parameter', e.target.value)}
                      className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <input
                      placeholder="Expected"
                      value={item.expected}
                      onChange={(e) => updateChecklistRow(idx, 'expected', e.target.value)}
                      className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <input
                      placeholder="Actual"
                      value={item.actual}
                      onChange={(e) => updateChecklistRow(idx, 'actual', e.target.value)}
                      className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={item.passed}
                        onChange={(e) => updateChecklistRow(idx, 'passed', e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-brand-700 focus:ring-brand-200"
                      />
                      Pass
                    </label>
                    {checklist.length > 1 && (
                      <button
                        onClick={() => removeChecklistRow(idx)}
                        className="text-sm text-danger-600 hover:text-danger-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addChecklistRow}
                className="mt-2 text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                + Add parameter
              </button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createQC}
                disabled={pending || !orderId || checklist.some((c) => !c.parameter)}
              >
                {pending ? 'Creating...' : 'Create QC'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* QC records list */}
      {isLoading ? (
        <div className="mt-12 text-center text-neutral-500">Loading...</div>
      ) : (records ?? []).length === 0 ? (
        <div className="mt-12 rounded-lg border border-neutral-200 bg-white p-12 text-center text-neutral-500">
          No quality check records yet. Create one to inspect an order.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {(records ?? []).map((rec) => (
            <div
              key={rec.id}
              className="rounded-lg border border-neutral-200 bg-white"
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-semibold text-brand-900">{rec.order.orderNumber}</div>
                    <div className="text-sm text-neutral-500">{rec.order.productName}</div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[rec.status] ?? ''}`}
                  >
                    {rec.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">{formatIST(rec.createdAt)}</span>
                  {rec.status === 'PENDING' && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(rec.id, 'PASSED')} disabled={pending}>
                        Pass
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => updateStatus(rec.id, 'FAILED')} disabled={pending}>
                        Fail
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(rec.id, 'REWORK')} disabled={pending}>
                        Rework
                      </Button>
                    </>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                    className="text-sm font-medium text-brand-700 hover:text-brand-800"
                  >
                    {expandedId === rec.id ? 'Hide' : 'Details'}
                  </button>
                </div>
              </div>

              {expandedId === rec.id && (
                <div className="border-t border-neutral-100 px-5 py-4">
                  {rec.remarks && (
                    <p className="mb-3 text-sm text-neutral-600">Remarks: {rec.remarks}</p>
                  )}
                  <table className="w-full text-sm">
                    <thead className="text-left text-neutral-500">
                      <tr>
                        <th className="pb-2 font-medium">Parameter</th>
                        <th className="pb-2 font-medium">Expected</th>
                        <th className="pb-2 font-medium">Actual</th>
                        <th className="pb-2 font-medium">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {rec.checklist.map((c, i) => (
                        <tr key={i}>
                          <td className="py-2">{c.parameter}</td>
                          <td className="py-2 text-neutral-500">{c.expected}</td>
                          <td className="py-2">{c.actual}</td>
                          <td className="py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                c.passed
                                  ? 'bg-success-50 text-success-700'
                                  : 'bg-danger-50 text-danger-700'
                              }`}
                            >
                              {c.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
