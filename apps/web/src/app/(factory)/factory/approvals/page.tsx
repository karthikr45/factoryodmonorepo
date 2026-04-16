'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

interface Rule {
  id: string;
  name: string;
  triggerType: string;
  conditionField: string | null;
  conditionOp: string;
  conditionValue: number | null;
  approverRoleIds: string[];
  approvalType: string;
  slaHours: number | null;
  isActive: boolean;
  priority: number;
}

interface Role { id: string; name: string; icon: string | null }

const TRIGGER_TYPES = [
  { value: 'OVERTIME', label: 'Overtime hours', field: 'hours', unit: 'hrs' },
  { value: 'LEAVE', label: 'Leave days', field: 'days', unit: 'days' },
  { value: 'PURCHASE_ORDER', label: 'Purchase order amount', field: 'amount', unit: '₹' },
  { value: 'PAYMENT_OUT', label: 'Payment to vendor', field: 'amount', unit: '₹' },
  { value: 'QC_REJECTION', label: 'Quality rejection', field: '', unit: '' },
  { value: 'STOCK_ISSUE', label: 'Material issued from store', field: 'amount', unit: '₹' },
  { value: 'VENDOR_ONBOARDING', label: 'New vendor onboarding', field: '', unit: '' },
  { value: 'CUSTOMER_CREDIT', label: 'Customer credit limit', field: 'amount', unit: '₹' },
  { value: 'DISCOUNT', label: 'Discount on order', field: 'percent', unit: '%' },
  { value: 'ORDER_DISPATCH', label: 'Order dispatch', field: 'amount', unit: '₹' },
];

const OPERATORS = [
  { value: 'ANY', label: 'Always' },
  { value: 'GT', label: 'Greater than' },
  { value: 'GTE', label: 'At least' },
  { value: 'LT', label: 'Less than' },
  { value: 'LTE', label: 'At most' },
];

export default function ApprovalsPage(): JSX.Element {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'rules' | 'pending' | 'simulator'>('rules');
  const [editing, setEditing] = useState<Rule | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { data: rules } = useQuery<Rule[]>({
    queryKey: ['approval-rules'],
    queryFn: () => apiCall<Rule[]>({ url: '/approvals/rules' }),
  });

  const { data: roles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => apiCall<Role[]>({ url: '/custom-roles' }),
  });

  const remove = (id: string): void => {
    if (!confirm('Delete this rule?')) return;
    void (async () => {
      await apiCall({ url: `/approvals/rules/${id}`, method: 'DELETE' });
      setToast('Rule deleted');
      qc.invalidateQueries({ queryKey: ['approval-rules'] });
    })();
  };

  const tabs = [
    { key: 'rules', label: 'Rules' },
    { key: 'pending', label: 'Pending approvals' },
    { key: 'simulator', label: 'Test rules' },
  ] as const;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Approval Matrix</h1>
          <p className="mt-1 text-neutral-600">
            Define who approves what — overtime, payments, purchases, QC rejections
          </p>
        </div>
        {tab === 'rules' && (
          <Button onClick={() => { setCreating(true); setEditing(null); }}>+ New rule</Button>
        )}
      </div>

      {toast && <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">{toast}</div>}

      <div className="mt-4 flex gap-2 border-b border-neutral-200">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.key ? 'border-brand-700 text-brand-900' : 'border-transparent text-neutral-500 hover:text-brand-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'rules' && (
        <RulesList rules={rules ?? []} roles={roles ?? []}
          onEdit={(r) => { setEditing(r); setCreating(false); }}
          onDelete={remove} />
      )}
      {tab === 'pending' && <PendingApprovals />}
      {tab === 'simulator' && <Simulator triggerTypes={TRIGGER_TYPES} />}

      {(creating || editing) && (
        <RuleEditor
          existing={editing}
          roles={roles ?? []}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            setCreating(false); setEditing(null);
            setToast(editing ? 'Rule updated' : 'Rule created');
            qc.invalidateQueries({ queryKey: ['approval-rules'] });
          }}
        />
      )}
    </div>
  );
}

function RulesList({ rules, roles, onEdit, onDelete }: {
  rules: Rule[]; roles: Role[];
  onEdit: (r: Rule) => void; onDelete: (id: string) => void;
}): JSX.Element {
  if (rules.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border-2 border-dashed border-brand-200 bg-white p-12 text-center">
        <div className="text-5xl">✋</div>
        <h2 className="mt-4 text-xl font-semibold text-brand-900">No approval rules yet</h2>
        <p className="mx-auto mt-2 max-w-md text-neutral-600">
          Create rules like &ldquo;Overtime more than 2 hours needs Production Manager approval&rdquo;.
        </p>
      </div>
    );
  }

  const triggerLabel = (t: string): string => TRIGGER_TYPES.find((x) => x.value === t)?.label ?? t;
  const roleName = (id: string): string => roles.find((r) => r.id === id)?.name ?? id;

  return (
    <div className="mt-6 space-y-3">
      {rules.map((r) => (
        <div key={r.id} className={`rounded-2xl border bg-white p-5 transition hover:shadow-md ${
          r.isActive ? 'border-neutral-200' : 'border-neutral-200 opacity-60'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-brand-900">{r.name}</h3>
                {!r.isActive && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">Disabled</span>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-700">
                <span className="font-medium">When</span>
                <span className="rounded bg-brand-50 px-2 py-1 font-medium text-brand-700">{triggerLabel(r.triggerType)}</span>
                {r.conditionOp !== 'ANY' && r.conditionValue !== null && (
                  <>
                    <span>{r.conditionOp.toLowerCase().replace('gte', 'is at least').replace('gt', 'is greater than').replace('lte', 'is at most').replace('lt', 'is less than')}</span>
                    <span className="rounded bg-warning-50 px-2 py-1 font-mono font-semibold text-warning-700">
                      {r.conditionValue}
                    </span>
                  </>
                )}
                <span className="text-neutral-500">→ approval from</span>
                {r.approverRoleIds.map((id) => (
                  <span key={id} className="rounded-full bg-accent-100 px-2 py-1 text-xs font-semibold text-accent-700">
                    {roleName(id)}
                  </span>
                ))}
                {r.approvalType !== 'SEQUENTIAL' && (
                  <span className="rounded-full bg-highlight-50 px-2 py-0.5 text-xs font-semibold text-highlight-500">
                    {r.approvalType}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(r)} className="text-sm font-semibold text-brand-700 hover:underline">Edit</button>
              <button onClick={() => onDelete(r.id)} className="text-sm font-semibold text-danger-600 hover:underline">Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PendingApprovals(): JSX.Element {
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const { data } = useQuery<Array<{
    id: string; triggerType: string; subjectType: string; subjectId: string;
    requesterName: string | null; createdAt: string;
    metadata: Record<string, unknown> | null;
  }>>({
    queryKey: ['pending-approvals'],
    queryFn: () => apiCall({ url: '/approvals/pending' }),
  });

  const act = (id: string, action: 'APPROVE' | 'REJECT'): void => {
    const notes = action === 'REJECT' ? (prompt('Reason for rejection?') ?? '') : undefined;
    start(async () => {
      try {
        const res = await apiCall<{ status: string; resumed?: boolean; resumeError?: string }>({
          url: `/approvals/${id}/act`,
          method: 'POST',
          data: { action, notes },
        });
        const msg = action === 'APPROVE'
          ? (res.resumed ? 'Approved — original action completed' : (res.resumeError ? `Approved but resume failed: ${res.resumeError}` : 'Approved'))
          : 'Rejected';
        setToast(msg);
        qc.invalidateQueries({ queryKey: ['pending-approvals'] });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Action failed');
      }
    });
  };

  if (!data || data.length === 0) {
    return (
      <div>
        {toast && <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">{toast}</div>}
        <div className="mt-8 rounded-2xl border border-success-200 bg-success-50 p-12 text-center">
          <div className="text-4xl">✅</div>
          <h2 className="mt-4 text-xl font-semibold text-success-800">All caught up</h2>
          <p className="mt-1 text-sm text-success-700">No pending approvals right now</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {toast && <div className="mt-4 rounded-md bg-success-50 px-4 py-2 text-sm text-success-700">{toast}</div>}
      <div className="mt-6 space-y-3">
        {data.map((r) => {
          const meta = r.metadata ?? {};
          const summary = Object.entries(meta)
            .filter(([k]) => !['_id', '__v'].includes(k))
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join(' · ');
          return (
            <div key={r.id} className="flex items-start justify-between gap-4 rounded-2xl border border-warning-200 bg-warning-50 p-5">
              <div className="flex-1">
                <div className="font-semibold text-warning-900">{r.triggerType.replace(/_/g, ' ')}</div>
                <div className="mt-1 text-sm text-warning-800">
                  {r.subjectType} · Requested by {r.requesterName ?? 'unknown'} on {new Date(r.createdAt).toLocaleString('en-IN')}
                </div>
                {summary && <div className="mt-1 text-xs text-warning-700">{summary}</div>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => act(r.id, 'APPROVE')} disabled={pending}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => act(r.id, 'REJECT')} disabled={pending}>Reject</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Simulator({ triggerTypes }: { triggerTypes: typeof TRIGGER_TYPES }): JSX.Element {
  const [trigger, setTrigger] = useState(triggerTypes[0]!.value);
  const [value, setValue] = useState('');
  const [results, setResults] = useState<Array<{ name: string; approverRoleIds: string[]; approvalType: string }> | null>(null);

  const test = (): void => {
    void (async () => {
      const r = await apiCall<Array<{ name: string; approverRoleIds: string[]; approvalType: string; id: string }>>({
        url: `/approvals/simulate?triggerType=${trigger}&value=${value || 0}`,
      });
      setResults(r);
    })();
  };

  const selected = triggerTypes.find((t) => t.value === trigger);

  return (
    <div className="mt-6 max-w-2xl rounded-2xl border border-brand-200 bg-brand-50 p-6">
      <h3 className="text-lg font-semibold text-brand-900">Test your approval rules</h3>
      <p className="mt-1 text-sm text-neutral-600">
        See exactly which approvers will be notified for a given trigger.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-semibold text-neutral-700">Trigger</label>
          <select value={trigger} onChange={(e) => setTrigger(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            {triggerTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {selected?.field && (
          <div>
            <label className="block text-xs font-semibold text-neutral-700">{selected.field} ({selected.unit})</label>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
        )}
        <div className="flex items-end">
          <Button onClick={test} className="w-full">Run simulation</Button>
        </div>
      </div>

      {results !== null && (
        <div className="mt-4">
          {results.length === 0 ? (
            <div className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-700">
              ✓ No approval needed — this would auto-proceed
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-brand-900">{results.length} rule(s) match:</div>
              {results.map((r, i) => (
                <div key={i} className="rounded-md border border-warning-200 bg-warning-50 p-3 text-sm">
                  <div className="font-semibold text-warning-900">{r.name}</div>
                  <div className="mt-1 text-warning-800">
                    Will require {r.approvalType.toLowerCase()} approval from {r.approverRoleIds.length} role(s)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RuleEditor({
  existing, roles, onClose, onSaved,
}: {
  existing: Rule | null;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}): JSX.Element {
  const [name, setName] = useState(existing?.name ?? '');
  const [triggerType, setTriggerType] = useState(existing?.triggerType ?? 'OVERTIME');
  const [conditionOp, setConditionOp] = useState(existing?.conditionOp ?? 'GT');
  const [conditionValue, setConditionValue] = useState(existing?.conditionValue?.toString() ?? '');
  const [approverRoleIds, setApproverRoleIds] = useState<string[]>(existing?.approverRoleIds ?? []);
  const [approvalType, setApprovalType] = useState(existing?.approvalType ?? 'SEQUENTIAL');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const trigger = TRIGGER_TYPES.find((t) => t.value === triggerType);

  const toggleRole = (id: string): void => {
    if (approverRoleIds.includes(id)) {
      setApproverRoleIds(approverRoleIds.filter((r) => r !== id));
    } else {
      setApproverRoleIds([...approverRoleIds, id]);
    }
  };

  const save = (): void => {
    setError(null);
    if (!name) { setError('Give the rule a name'); return; }
    if (approverRoleIds.length === 0) { setError('Pick at least one approver role'); return; }

    start(async () => {
      try {
        const body = {
          name, triggerType,
          conditionField: trigger?.field || undefined,
          conditionOp,
          conditionValue: conditionValue ? Number(conditionValue) : undefined,
          approverRoleIds, approvalType,
        };
        if (existing) {
          await apiCall({ url: `/approvals/rules/${existing.id}`, method: 'PUT', data: body });
        } else {
          await apiCall({ url: '/approvals/rules', method: 'POST', data: body });
        }
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-950/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl animate-scale-in rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-brand-900">{existing ? 'Edit rule' : 'Create approval rule'}</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Rule name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Overtime above 2 hours"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>

          <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">When</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
                {TRIGGER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select value={conditionOp} onChange={(e) => setConditionOp(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
                {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {conditionOp !== 'ANY' && trigger?.field && (
                <input type="number" placeholder={trigger.unit} value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-accent-200 bg-accent-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent-700">Then notify approvers</div>
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {roles.map((r) => (
                <label key={r.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-white">
                  <input type="checkbox" checked={approverRoleIds.includes(r.id)} onChange={() => toggleRole(r.id)} />
                  {r.icon} {r.name}
                </label>
              ))}
            </div>
            {approverRoleIds.length > 1 && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-neutral-700">Approval flow</label>
                <select value={approvalType} onChange={(e) => setApprovalType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
                  <option value="SEQUENTIAL">Sequential — one after another</option>
                  <option value="PARALLEL">Parallel — all at once, all must approve</option>
                  <option value="ANY">Any one — first approver decides</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {error && <div className="mt-3 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={pending}>{pending ? 'Saving...' : 'Save rule'}</Button>
        </div>
      </div>
    </div>
  );
}
