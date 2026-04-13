'use client';

import { use, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';

import { requestOtpAction, verifyOtpAction } from '../login/actions';

interface Props {
  searchParamsPromise: Promise<{ role?: string; token?: string }>;
}

export function SignupForm({ searchParamsPromise }: Props): JSX.Element {
  const sp = use(searchParamsPromise);
  const roleHint = sp.role ?? null;
  const inviteToken = sp.token ?? null;

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
      if (inviteToken) fd.set('inviteToken', inviteToken);
      const res = await verifyOtpAction(fd);
      if (!res?.ok) setError(res?.error ?? 'Verification failed');
    });
  };

  const roleLabels: Record<string, string> = {
    FACTORY: 'Factory / Manufacturer',
    AGENCY: 'Staffing Agency',
    CA_FIRM: 'Chartered Accountant',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">
        {inviteToken ? 'Accept invitation' : 'Create your FactoryOS account'}
      </h1>
      {roleHint && roleLabels[roleHint] ? (
        <p className="mt-2 text-sm text-brand-700">
          Signing up as <span className="font-semibold">{roleLabels[roleHint]}</span>
        </p>
      ) : null}
      <p className="mt-2 text-sm text-neutral-500">
        {stage === 'phone'
          ? 'Enter your phone number. We will send a 6-digit code.'
          : `Enter the code sent to ${phone}`}
      </p>

      {stage === 'phone' ? (
        <form onSubmit={handlePhone} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Phone number</span>
            <input
              name="phone" type="tel" required placeholder="+919876543210"
              value={phone} onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Sending code...' : 'Send OTP'}
          </Button>
          <p className="text-center text-xs text-neutral-500">
            By signing up, you agree to receive SMS for verification.
          </p>
        </form>
      ) : (
        <form onSubmit={handleCode} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">6-digit code</span>
            <input
              name="code" inputMode="numeric" autoComplete="one-time-code"
              maxLength={6} required value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-center text-lg tracking-[0.5em] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <Button type="submit" disabled={pending || code.length !== 6} className="w-full">
            {pending ? 'Verifying...' : 'Verify & continue'}
          </Button>
          <button
            type="button"
            onClick={() => { setStage('phone'); setCode(''); }}
            className="w-full text-sm text-brand-700 hover:underline"
          >
            Use a different number
          </button>
        </form>
      )}

      {error ? (
        <div className="mt-4 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>
      ) : null}
    </div>
  );
}
