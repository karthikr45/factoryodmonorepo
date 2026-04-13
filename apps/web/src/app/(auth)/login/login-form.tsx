'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';

import { requestOtpAction, verifyOtpAction } from './actions';

export function LoginForm(): JSX.Element {
  const [phone, setPhone] = useState('+91');
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
      if (!res?.ok) setError(res?.error ?? 'Verification failed');
    });
  };

  return (
    <div>
      {/* Mobile-only logo */}
      <Link href="/" className="lg:hidden mb-8 inline-flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-900 text-sm font-bold text-white">
          F
        </div>
        <span className="text-lg font-bold text-brand-900">FactoryOS</span>
      </Link>

      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold tracking-tight text-brand-900">
          {stage === 'phone' ? 'Welcome back' : 'Check your phone'}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {stage === 'phone'
            ? 'Enter your phone to sign in with a secure code.'
            : (
              <>
                We sent a 6-digit code to <span className="font-semibold text-brand-700">{phone}</span>
              </>
            )}
        </p>
      </div>

      {stage === 'phone' ? (
        <form onSubmit={handlePhone} className="mt-8 space-y-5 animate-fade-in-up [animation-delay:100ms]">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">Phone number</span>
            <div className="mt-2 relative">
              <input
                name="phone" type="tel" required placeholder="+91 9876543210"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3.5 text-base transition focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
              />
            </div>
          </label>
          <Button type="submit" disabled={pending} className="w-full rounded-lg py-3.5 text-base font-semibold shadow-lg shadow-brand-600/20">
            {pending ? (
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Sending code...
              </span>
            ) : 'Continue with OTP'}
          </Button>
          <p className="text-center text-xs text-neutral-500">
            By continuing, you agree to receive SMS for verification.
          </p>
        </form>
      ) : (
        <form onSubmit={handleCode} className="mt-8 space-y-5 animate-fade-in-up">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">6-digit code</span>
            <input
              name="code" inputMode="numeric" autoComplete="one-time-code"
              maxLength={6} required value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-4 text-center text-2xl font-semibold tracking-[0.5em] transition focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
              placeholder="• • • • • •"
            />
          </label>
          <Button type="submit" disabled={pending || code.length !== 6} className="w-full rounded-lg py-3.5 text-base font-semibold shadow-lg shadow-brand-600/20">
            {pending ? (
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Verifying...
              </span>
            ) : 'Verify & continue'}
          </Button>
          <button
            type="button"
            onClick={() => { setStage('phone'); setCode(''); setError(null); }}
            className="w-full text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            ← Use a different number
          </button>
        </form>
      )}

      {error ? (
        <div className="mt-4 animate-fade-in rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      ) : null}

      <div className="mt-8 border-t border-neutral-100 pt-6 text-center text-sm text-neutral-600">
        New to FactoryOS?{' '}
        <Link href="/signup" className="font-semibold text-brand-700 hover:text-brand-800 hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}
