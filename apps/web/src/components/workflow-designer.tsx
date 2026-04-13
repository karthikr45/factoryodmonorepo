'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

interface Stage {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sequence: number;
  slaHours?: number;
  qcRequired?: boolean;
  qcChecklist?: Array<{ parameter: string; expected: string }>;
  isOutsourced?: boolean;
  autoAdvance?: 'ALWAYS' | 'ON_QC_PASS' | 'MANUAL';
  parallelGroupId?: string;
  notes?: string;
}

const INDUSTRIES = [
  { value: 'GENERAL', label: 'General Manufacturing' },
  { value: 'TEXTILE', label: 'Textile' },
  { value: 'AUTO_COMPONENTS', label: 'Auto Components' },
  { value: 'PHARMA', label: 'Pharma' },
  { value: 'FOOD_PROCESSING', label: 'Food Processing' },
  { value: 'JOB_WORK', label: 'Job Work / CNC' },
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'CUSTOM', label: 'Custom' },
];

const STAGE_ICONS = [
  '📥', '✂️', '⚙️', '🔨', '🔧', '🧪', '🔥', '💠', '🎨', '🪡',
  '🔍', '✅', '📦', '🚚', '⚖️', '☀️', '🌀', '💊', '🧂', '🧊',
];

export function WorkflowDesigner({
  existing,
  onSaved,
}: {
  existing?: {
    id: string;
    name: string;
    description: string | null;
    industry: string;
    icon: string | null;
    isDefault: boolean;
    stages: Stage[];
  };
  onSaved?: (id: string) => void;
}): JSX.Element {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [industry, setIndustry] = useState(existing?.industry ?? 'GENERAL');
  const [icon, setIcon] = useState(existing?.icon ?? '🏭');
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? false);
  const [stages, setStages] = useState<Stage[]>(
    existing?.stages && existing.stages.length > 0
      ? existing.stages
      : [{ name: 'New stage', sequence: 1, icon: '⚙️' }],
  );
  const [editingStage, setEditingStage] = useState<number | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPending, startAi] = useTransition();

  const generateWithAI = (): void => {
    if (!aiPrompt.trim()) return;
    startAi(async () => {
      try {
        const res = await apiCall<{
          name: string; description: string; industry: string; icon: string;
          stages: Array<{ name: string; icon: string; sequence: number; slaHours: number; qcRequired: boolean; isOutsourced: boolean; description: string }>;
        }>({ url: '/ai/generate-workflow', method: 'POST', data: { description: aiPrompt } });
        setName(res.name);
        setDescription(res.description);
        setIndustry(res.industry);
        setIcon(res.icon);
        setStages(res.stages.map((s, i) => ({
          name: s.name, icon: s.icon, sequence: s.sequence ?? i + 1,
          slaHours: s.slaHours, qcRequired: s.qcRequired, isOutsourced: s.isOutsourced,
          description: s.description,
        })));
        setAiOpen(false);
        setAiPrompt('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'AI generation failed');
      }
    });
  };

  const moveStage = (idx: number, dir: -1 | 1): void => {
    const next = idx + dir;
    if (next < 0 || next >= stages.length) return;
    const copy = [...stages];
    [copy[idx], copy[next]] = [copy[next]!, copy[idx]!];
    copy.forEach((s, i) => { s.sequence = i + 1; });
    setStages(copy);
  };

  const addStage = (): void => {
    setStages([...stages, {
      name: 'New stage', sequence: stages.length + 1, icon: '⚙️',
    }]);
    setEditingStage(stages.length);
  };

  const removeStage = (idx: number): void => {
    if (stages.length <= 1) { setError('Need at least one stage'); return; }
    const copy = stages.filter((_, i) => i !== idx);
    copy.forEach((s, i) => { s.sequence = i + 1; });
    setStages(copy);
    setEditingStage(null);
  };

  const updateStage = (idx: number, patch: Partial<Stage>): void => {
    const copy = [...stages];
    copy[idx] = { ...copy[idx]!, ...patch };
    setStages(copy);
  };

  const save = (): void => {
    setError(null);
    if (!name) { setError('Give your workflow a name'); return; }
    if (stages.length === 0) { setError('Add at least one stage'); return; }

    start(async () => {
      try {
        const body = { name, description, industry, icon, isDefault, stages };
        const res = existing
          ? await apiCall<{ id: string }>({ url: `/workflows/${existing.id}`, method: 'PUT', data: body })
          : await apiCall<{ id: string }>({ url: '/workflows', method: 'POST', data: body });
        if (onSaved) onSaved(res.id);
        else router.push('/factory/workflows');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed');
      }
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            {existing ? 'Edit workflow' : 'Design a new workflow'}
          </h1>
          <p className="mt-1 text-neutral-600">
            Define stages, assign roles, set SLAs, and add QC gates
          </p>
        </div>
        <div className="flex gap-2">
          {!existing && (
            <button onClick={() => setAiOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-brand-700 to-highlight-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:shadow-xl">
              <span>✨</span> Generate with AI
            </button>
          )}
          <Button variant="outline" onClick={() => router.push('/factory/workflows')}>Cancel</Button>
          <Button onClick={save} disabled={pending}>{pending ? 'Saving...' : 'Save workflow'}</Button>
        </div>
      </div>

      {/* AI generator modal */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-950/50" onClick={() => setAiOpen(false)} />
          <div className="relative w-full max-w-xl animate-scale-in rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✨</span>
              <div>
                <h2 className="text-xl font-bold text-brand-900">Generate workflow with AI</h2>
                <p className="text-sm text-neutral-600">Describe your business in 1-2 sentences and we'll draft a workflow.</p>
              </div>
            </div>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
              rows={4} placeholder="e.g., I run a small CNC workshop in Hyderabad making auto components for Tata. We do cutting, machining, and grinding."
              className="mt-4 w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100" />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAiOpen(false)}>Cancel</Button>
              <Button onClick={generateWithAI} disabled={aiPending || !aiPrompt.trim()}>
                {aiPending ? 'Thinking...' : '✨ Generate workflow'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mt-4 rounded-md bg-danger-50 px-4 py-2 text-sm text-danger-700">{error}</div>}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: basics */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Basics</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Brake Bracket Production"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What kind of orders use this workflow?"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700">Industry</label>
                <select value={industry} onChange={(e) => setIndustry(e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
                  {INDUSTRIES.map((i) => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700">Icon</label>
                <div className="mt-2 grid grid-cols-8 gap-1">
                  {STAGE_ICONS.map((i) => (
                    <button key={i} type="button" onClick={() => setIcon(i)}
                      className={`flex h-8 items-center justify-center rounded text-lg transition ${
                        icon === i ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-neutral-50 hover:bg-neutral-100'
                      }`}>{i}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                Set as default workflow for new orders
              </label>
            </div>
          </div>
        </div>

        {/* Right: stage list */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                Stages ({stages.length})
              </h3>
              <Button size="sm" variant="outline" onClick={addStage}>+ Add stage</Button>
            </div>

            <div className="mt-4 space-y-2">
              {stages.map((s, idx) => (
                <div key={idx}
                  className={`rounded-xl border p-3 transition ${
                    editingStage === idx ? 'border-brand-400 bg-brand-50' : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-mono text-neutral-400 w-6">{idx + 1}</div>
                    <div className="text-2xl">{s.icon ?? '⚙️'}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-brand-900">{s.name}</div>
                      <div className="mt-0.5 flex flex-wrap gap-1.5 text-xs text-neutral-500">
                        {s.slaHours !== undefined && s.slaHours > 0 && (
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5">SLA {s.slaHours}h</span>
                        )}
                        {s.qcRequired && <span className="rounded bg-warning-50 px-1.5 py-0.5 text-warning-700">QC gate</span>}
                        {s.isOutsourced && <span className="rounded bg-accent-50 px-1.5 py-0.5 text-accent-700">Outsourced</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => moveStage(idx, -1)} disabled={idx === 0}
                        className="h-7 w-7 rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-30">↑</button>
                      <button onClick={() => moveStage(idx, 1)} disabled={idx === stages.length - 1}
                        className="h-7 w-7 rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-30">↓</button>
                      <button onClick={() => setEditingStage(editingStage === idx ? null : idx)}
                        className="h-7 rounded px-2 text-xs font-semibold text-brand-700 hover:bg-brand-100">
                        {editingStage === idx ? 'Close' : 'Edit'}
                      </button>
                      <button onClick={() => removeStage(idx)}
                        className="h-7 w-7 rounded text-danger-600 hover:bg-danger-50">×</button>
                    </div>
                  </div>

                  {editingStage === idx && (
                    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-brand-200 pt-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700">Stage name</label>
                        <input value={s.name} onChange={(e) => updateStage(idx, { name: e.target.value })}
                          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700">SLA (hours)</label>
                        <input type="number" min="0" step="0.5"
                          value={s.slaHours ?? ''} onChange={(e) => updateStage(idx, { slaHours: e.target.value ? Number(e.target.value) : undefined })}
                          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-neutral-700">Description</label>
                        <input value={s.description ?? ''} onChange={(e) => updateStage(idx, { description: e.target.value })}
                          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-neutral-700">Icon</label>
                        <div className="mt-1 grid grid-cols-10 gap-1">
                          {STAGE_ICONS.map((i) => (
                            <button key={i} type="button" onClick={() => updateStage(idx, { icon: i })}
                              className={`flex h-7 items-center justify-center rounded text-base transition ${
                                s.icon === i ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-neutral-50 hover:bg-neutral-100'
                              }`}>{i}</button>
                          ))}
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={s.qcRequired ?? false}
                          onChange={(e) => updateStage(idx, { qcRequired: e.target.checked })} />
                        Quality check required at this stage
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={s.isOutsourced ?? false}
                          onChange={(e) => updateStage(idx, { isOutsourced: e.target.checked })} />
                        This stage is outsourced
                      </label>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-neutral-700">Notes</label>
                        <textarea value={s.notes ?? ''} onChange={(e) => updateStage(idx, { notes: e.target.value })}
                          rows={2}
                          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Live preview */}
            <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Workflow preview</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {stages.map((s, i) => (
                  <div key={i} className="contents">
                    <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs">
                      <span>{s.icon ?? '⚙️'}</span>
                      <span className="font-semibold">{s.name}</span>
                      {s.qcRequired && <span className="text-warning-600">🔍</span>}
                      {s.isOutsourced && <span className="text-accent-600">↗</span>}
                    </div>
                    {i < stages.length - 1 && <span className="text-neutral-400">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
