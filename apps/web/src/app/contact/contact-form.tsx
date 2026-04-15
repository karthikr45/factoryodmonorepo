'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

export function ContactForm(): JSX.Element {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [pending, start] = useTransition();
  const [state, setState] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setError(null);
    start(async () => {
      try {
        await apiCall({
          url: '/content/contact', method: 'POST',
          data: {
            name, email, phone: phone || undefined,
            company: company || undefined,
            subject: subject || undefined,
            message, source: 'contact_page',
          },
        });
        setState('success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send');
        setState('error');
      }
    });
  };

  if (state === 'success') {
    return (
      <div className="rounded-2xl border-2 border-success-300 bg-success-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-500 text-2xl text-white">
          ✓
        </div>
        <h3 className="mt-4 text-xl font-bold text-success-900">Message sent</h3>
        <p className="mt-2 text-sm text-success-800">
          We&apos;ll get back to you within 24 hours on business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
      <h3 className="text-lg font-semibold text-brand-900">Send us a message</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-neutral-700">Name *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700">Email *</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9876543210"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700">Company</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-neutral-700">Subject</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)}
          placeholder="What's this about?"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-neutral-700">Message *</label>
        <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
      </div>
      <Button type="submit" disabled={pending || !name || !email || !message} className="w-full">
        {pending ? 'Sending...' : 'Send message'}
      </Button>
      {error && (
        <div className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>
      )}
    </form>
  );
}
