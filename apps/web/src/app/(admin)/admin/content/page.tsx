'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

interface Testimonial {
  id: string; author: string; title: string | null; quote: string;
  initials: string | null; avatarUrl: string | null;
  isPublished: boolean; sortOrder: number;
  colorFrom: string | null; colorTo: string | null;
}

interface FAQ {
  id: string; question: string; answer: string; category: string;
  isPublished: boolean; sortOrder: number;
}

export default function ContentPage(): JSX.Element {
  const [tab, setTab] = useState<'testimonials' | 'faqs'>('testimonials');

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Marketing content</h1>
      <p className="mt-1 text-neutral-600">
        Manage testimonials and FAQs shown on the public landing page.
      </p>

      <div className="mt-4 flex gap-2 border-b border-neutral-200">
        {(['testimonials', 'faqs'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t ? 'border-brand-700 text-brand-900' : 'border-transparent text-neutral-500 hover:text-brand-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'testimonials' ? <TestimonialsAdmin /> : <FAQsAdmin />}
    </div>
  );
}

function TestimonialsAdmin(): JSX.Element {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const { data } = useQuery<Testimonial[]>({
    queryKey: ['testimonials-all'],
    queryFn: () => apiCall<Testimonial[]>({ url: '/content/testimonials/all' }),
  });

  const remove = (id: string): void => {
    if (!confirm('Delete this testimonial?')) return;
    start(async () => {
      await apiCall({ url: `/content/testimonials/${id}`, method: 'DELETE' });
      setToast('Deleted');
      qc.invalidateQueries({ queryKey: ['testimonials-all'] });
    });
  };

  const togglePublish = (t: Testimonial): void => {
    start(async () => {
      await apiCall({ url: `/content/testimonials/${t.id}`, method: 'PUT', data: { isPublished: !t.isPublished } });
      qc.invalidateQueries({ queryKey: ['testimonials-all'] });
    });
  };

  return (
    <div className="mt-6">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => { setCreating(true); setEditing(null); }}>+ Add testimonial</Button>
      </div>
      {toast && <div className="mb-3 rounded bg-success-50 px-3 py-2 text-sm text-success-700">{toast}</div>}

      <div className="space-y-3">
        {(data ?? []).map((t) => (
          <div key={t.id} className={`rounded-2xl border p-5 ${t.isPublished ? 'border-neutral-200 bg-white' : 'border-neutral-200 bg-neutral-50 opacity-60'}`}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${t.colorFrom ?? '#562F54'}, ${t.colorTo ?? '#8DF688'})` }}>
                {t.initials ?? t.author.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-brand-900">{t.author}</div>
                {t.title && <div className="text-sm text-neutral-600">{t.title}</div>}
                <p className="mt-2 text-sm text-neutral-700">{t.quote}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => togglePublish(t)} disabled={pending}
                  className={`rounded-full px-3 py-0.5 text-xs font-semibold ${t.isPublished ? 'bg-success-100 text-success-700' : 'bg-neutral-200 text-neutral-700'}`}>
                  {t.isPublished ? 'Published' : 'Hidden'}
                </button>
                <button onClick={() => { setEditing(t); setCreating(false); }} className="text-xs font-semibold text-brand-700 hover:underline">Edit</button>
                <button onClick={() => remove(t.id)} className="text-xs font-semibold text-danger-600 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <TestimonialForm
          existing={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); setToast('Saved'); qc.invalidateQueries({ queryKey: ['testimonials-all'] }); }}
        />
      )}
    </div>
  );
}

function TestimonialForm({ existing, onClose, onSaved }: { existing: Testimonial | null; onClose: () => void; onSaved: () => void }): JSX.Element {
  const [author, setAuthor] = useState(existing?.author ?? '');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [quote, setQuote] = useState(existing?.quote ?? '');
  const [colorFrom, setColorFrom] = useState(existing?.colorFrom ?? '#562F54');
  const [colorTo, setColorTo] = useState(existing?.colorTo ?? '#8DF688');
  const [pending, start] = useTransition();

  const save = (): void => {
    start(async () => {
      const body = { author, title, quote, colorFrom, colorTo };
      if (existing) await apiCall({ url: `/content/testimonials/${existing.id}`, method: 'PUT', data: body });
      else await apiCall({ url: '/content/testimonials', method: 'POST', data: body });
      onSaved();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-950/50" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-brand-900">{existing ? 'Edit' : 'Add'} testimonial</h2>
        <div className="mt-4 space-y-3">
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name"
            className="w-full rounded-md border border-neutral-300 px-3 py-2" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g., Owner, ABC Components)"
            className="w-full rounded-md border border-neutral-300 px-3 py-2" />
          <textarea value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Quote" rows={4}
            className="w-full rounded-md border border-neutral-300 px-3 py-2" />
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-neutral-600">Avatar gradient — start</span>
              <input type="color" value={colorFrom} onChange={(e) => setColorFrom(e.target.value)} className="mt-1 h-10 w-full" />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-600">Avatar gradient — end</span>
              <input type="color" value={colorTo} onChange={(e) => setColorTo(e.target.value)} className="mt-1 h-10 w-full" />
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={pending || !author || !quote}>Save</Button>
        </div>
      </div>
    </div>
  );
}

function FAQsAdmin(): JSX.Element {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, start] = useTransition();

  const { data } = useQuery<FAQ[]>({
    queryKey: ['faqs-all'],
    queryFn: () => apiCall<FAQ[]>({ url: '/content/faqs/all' }),
  });

  const remove = (id: string): void => {
    if (!confirm('Delete this FAQ?')) return;
    start(async () => {
      await apiCall({ url: `/content/faqs/${id}`, method: 'DELETE' });
      qc.invalidateQueries({ queryKey: ['faqs-all'] });
    });
  };

  const togglePublish = (f: FAQ): void => {
    start(async () => {
      await apiCall({ url: `/content/faqs/${f.id}`, method: 'PUT', data: { isPublished: !f.isPublished } });
      qc.invalidateQueries({ queryKey: ['faqs-all'] });
    });
  };

  return (
    <div className="mt-6">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => { setCreating(true); setEditing(null); }}>+ Add FAQ</Button>
      </div>

      <div className="space-y-2">
        {(data ?? []).map((f) => (
          <div key={f.id} className={`rounded-2xl border p-5 ${f.isPublished ? 'border-neutral-200 bg-white' : 'border-neutral-200 bg-neutral-50 opacity-60'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">{f.category}</span>
                  <span className="text-xs text-neutral-500">order: {f.sortOrder}</span>
                </div>
                <div className="mt-2 font-semibold text-brand-900">{f.question}</div>
                <p className="mt-1 text-sm text-neutral-600">{f.answer}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => togglePublish(f)} disabled={pending}
                  className={`rounded-full px-3 py-0.5 text-xs font-semibold ${f.isPublished ? 'bg-success-100 text-success-700' : 'bg-neutral-200 text-neutral-700'}`}>
                  {f.isPublished ? 'Published' : 'Hidden'}
                </button>
                <button onClick={() => { setEditing(f); setCreating(false); }} className="text-xs font-semibold text-brand-700 hover:underline">Edit</button>
                <button onClick={() => remove(f.id)} className="text-xs font-semibold text-danger-600 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <FAQForm existing={editing} onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); qc.invalidateQueries({ queryKey: ['faqs-all'] }); }} />
      )}
    </div>
  );
}

function FAQForm({ existing, onClose, onSaved }: { existing: FAQ | null; onClose: () => void; onSaved: () => void }): JSX.Element {
  const [question, setQuestion] = useState(existing?.question ?? '');
  const [answer, setAnswer] = useState(existing?.answer ?? '');
  const [category, setCategory] = useState(existing?.category ?? 'GENERAL');
  const [sortOrder, setSortOrder] = useState(existing?.sortOrder?.toString() ?? '0');
  const [pending, start] = useTransition();

  const save = (): void => {
    start(async () => {
      const body = { question, answer, category, sortOrder: Number(sortOrder) };
      if (existing) await apiCall({ url: `/content/faqs/${existing.id}`, method: 'PUT', data: body });
      else await apiCall({ url: '/content/faqs', method: 'POST', data: body });
      onSaved();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-950/50" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-brand-900">{existing ? 'Edit' : 'Add'} FAQ</h2>
        <div className="mt-4 space-y-3">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question"
            className="w-full rounded-md border border-neutral-300 px-3 py-2" />
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Answer" rows={5}
            className="w-full rounded-md border border-neutral-300 px-3 py-2" />
          <div className="grid grid-cols-2 gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2">
              <option value="GENERAL">General</option>
              <option value="PRICING">Pricing</option>
              <option value="TECHNICAL">Technical</option>
              <option value="ONBOARDING">Onboarding</option>
              <option value="COMPLIANCE">Compliance</option>
            </select>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="Sort order"
              className="rounded-md border border-neutral-300 px-3 py-2" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={pending || !question || !answer}>Save</Button>
        </div>
      </div>
    </div>
  );
}
