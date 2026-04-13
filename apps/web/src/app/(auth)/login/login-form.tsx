'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';

import { requestOtpAction, verifyOtpAction } from './actions';

export function LoginForm(): JSX.Element {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const handlePhone = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.set('phone', phone);
      const res = await requestOtpAction(fd);
      if (res.ok) setStage('code');
      else setError(res.error ?? 'Failed to send OTP');
    });
  };

  const handleCode = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.set('phone', phone);
      fd.set('code', code);
      const res = await verifyOtpAction(fd);
      // On success the action redirects, so we only reach here on failure.
      if (!res?.ok) setError(res?.error ?? 'Verification failed');
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Sign in to FactoryOS</h1>
      <p className="mt-2 text-sm text-neutral-500">
        {stage === 'phone'
          ? 'Enter your phone — we will send a 6-digit code.'
          : `Enter the 6-digit code sent to ${phone}.`}
      </p>

      {stage === 'phone' ? (
        <form onSubmit={handlePhone} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Phone number</span>
            <input
              name="phone"
              type="tel"
              required
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Sending...' : 'Send OTP'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleCode} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">6-digit code</span>
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-center text-lg tracking-[0.5em] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <Button type="submit" disabled={pending || code.length !== 6} className="w-full">
            {pending ? 'Verifying...' : 'Verify & continue'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setStage('phone');
              setCode('');
            }}
            className="w-full text-sm text-brand-700 hover:underline"
          >
            Use a different number
          </button>
        </form>
      )}

      {error ? (
        <div className="mt-4 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 border-t border-neutral-100 pt-4 text-center text-sm text-neutral-600">
        New to FactoryOS?{' '}
        <a href="/signup" className="font-semibold text-brand-700 hover:underline">Create an account</a>
      </div>
    </div>
  );
}
