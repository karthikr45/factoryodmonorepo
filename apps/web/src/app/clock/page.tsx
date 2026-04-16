'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'factoryos.contract-worker.token';
const WORKER_KEY = 'factoryos.contract-worker.profile';

interface DeploymentRow { factoryOrgId: string; factoryName: string; checkedIn: boolean; checkInTime: string | null; checkOutTime: string | null }
interface Slip { id: string; period: string; netRupees: number; status: string; pdfUrl: string }

export default function ClockPage(): JSX.Element {
  const [token, setToken] = useState<string | null>(null);
  const [worker, setWorker] = useState<{ id: string; name: string; skill: string } | null>(null);

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    const w = localStorage.getItem(WORKER_KEY);
    if (t) setToken(t);
    if (w) try { setWorker(JSON.parse(w)); } catch { /* noop */ }
  }, []);

  const handleAuth = (newToken: string, newWorker: { id: string; name: string; skill: string }): void => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(WORKER_KEY, JSON.stringify(newWorker));
    setToken(newToken); setWorker(newWorker);
  };

  const logout = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(WORKER_KEY);
    setToken(null); setWorker(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-900 via-brand-700 to-accent-600 px-4 py-6 text-white">
      <header className="mx-auto flex max-w-md items-center justify-between">
        <Link href="/" className="text-xs uppercase tracking-wider text-white/70">FactoryOS · Worker</Link>
        {token && <button onClick={logout} className="text-xs text-white/70 hover:text-white">Sign out</button>}
      </header>
      <main className="mx-auto mt-6 max-w-md">
        {!token || !worker ? (
          <Login onAuth={handleAuth} />
        ) : (
          <Dashboard token={token} worker={worker} />
        )}
      </main>
    </div>
  );
}

function Login({ onAuth }: { onAuth: (t: string, w: { id: string; name: string; skill: string }) => void }): JSX.Element {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const send = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault(); setError(null);
    start(async () => {
      try {
        const res = await fetch(`${apiUrl}/api/contract-worker-portal/otp/request`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }),
        });
        if (!res.ok) throw new Error((await res.json())?.error?.message ?? 'Failed to send OTP');
        setStage('code');
      } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    });
  };

  const verify = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault(); setError(null);
    start(async () => {
      try {
        const res = await fetch(`${apiUrl}/api/contract-worker-portal/otp/verify`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, code }),
        });
        const body = await res.json();
        if (!res.ok || body?.success === false) throw new Error(body?.error?.message ?? 'Invalid code');
        const data = body.data ?? body;
        onAuth(data.accessToken, data.worker);
      } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
    });
  };

  return (
    <div className="rounded-2xl bg-white p-6 text-neutral-900 shadow-2xl">
      <h1 className="text-xl font-bold">Worker check-in</h1>
      <p className="mt-1 text-sm text-neutral-600">Enter your phone — your agency must have added you first.</p>

      {stage === 'phone' ? (
        <form onSubmit={send} className="mt-4 space-y-3">
          <input type="tel" inputMode="numeric" required placeholder="9876543210" value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
          <Button type="submit" disabled={pending} className="w-full">{pending ? 'Sending…' : 'Send code'}</Button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-4 space-y-3">
          <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full rounded-md border border-neutral-300 px-3 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="• • • • • •" />
          <Button type="submit" disabled={pending || code.length !== 6} className="w-full">{pending ? 'Verifying…' : 'Verify'}</Button>
          <button type="button" onClick={() => setStage('phone')} className="block w-full text-center text-xs text-brand-700 hover:underline">
            ← Use a different number
          </button>
        </form>
      )}

      {error && <div className="mt-3 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</div>}
    </div>
  );
}

function Dashboard({ token, worker }: { token: string; worker: { id: string; name: string; skill: string } }): JSX.Element {
  const [today, setToday] = useState<DeploymentRow[]>([]);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const refresh = (): void => {
    void Promise.all([
      fetch(`${apiUrl}/api/contract-worker-portal/me`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((b) => setToday((b.data ?? b).today)),
      fetch(`${apiUrl}/api/contract-worker-portal/payslips`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((b) => setSlips(b.data ?? b)),
    ]).catch(() => undefined);
  };

  useEffect(() => { refresh(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const getCoords = (): Promise<{ lat?: number; lng?: number }> => new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve({});
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({}),
      { timeout: 4000 },
    );
  });

  const checkIn = (factoryOrgId: string): void => {
    setToast(null);
    start(async () => {
      try {
        const coords = await getCoords();
        const res = await fetch(`${apiUrl}/api/contract-worker-portal/check-in`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ factoryOrgId, ...coords }),
        });
        const body = await res.json();
        if (!res.ok || body?.success === false) throw new Error(body?.error?.message ?? 'Failed');
        setToast('Checked in ✓');
        refresh();
      } catch (err) { setToast(err instanceof Error ? err.message : 'Failed'); }
    });
  };

  const checkOut = (factoryOrgId: string): void => {
    setToast(null);
    start(async () => {
      try {
        const coords = await getCoords();
        const res = await fetch(`${apiUrl}/api/contract-worker-portal/check-out`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ factoryOrgId, ...coords }),
        });
        const body = await res.json();
        if (!res.ok || body?.success === false) throw new Error(body?.error?.message ?? 'Failed');
        setToast(`Checked out · ${(body.data ?? body).totalHours} hrs today`);
        refresh();
      } catch (err) { setToast(err instanceof Error ? err.message : 'Failed'); }
    });
  };

  const openSlip = (slip: Slip): void => {
    start(async () => {
      try {
        const res = await fetch(`${apiUrl}${slip.pdfUrl}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Could not download slip');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Revoke later so the blob URL can be used by the new tab.
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch (err) { setToast(err instanceof Error ? err.message : 'Failed'); }
    });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-5 text-neutral-900 shadow-2xl">
        <div className="text-xs uppercase tracking-wider text-brand-700">Hi {worker.name.split(' ')[0]}</div>
        <div className="mt-1 text-lg font-bold text-brand-900">{worker.skill}</div>
      </section>

      {toast && (
        <div className="rounded-md bg-white px-4 py-2 text-sm text-brand-900">{toast}</div>
      )}

      <section className="rounded-2xl bg-white p-5 text-neutral-900 shadow-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-700">Today</h2>
        {today.length === 0 ? (
          <div className="mt-3 text-sm text-neutral-500">No active deployments. Ask your agency.</div>
        ) : (
          <div className="mt-3 space-y-3">
            {today.map((d) => (
              <div key={d.factoryOrgId} className="rounded-lg border border-neutral-200 p-3">
                <div className="font-semibold text-brand-900">{d.factoryName}</div>
                <div className="mt-1 text-xs text-neutral-500">
                  {d.checkInTime ? `Checked in at ${new Date(d.checkInTime).toLocaleTimeString('en-IN')}` : 'Not checked in'}
                  {d.checkOutTime ? ` · out ${new Date(d.checkOutTime).toLocaleTimeString('en-IN')}` : ''}
                </div>
                <div className="mt-2 flex gap-2">
                  {!d.checkInTime ? (
                    <Button onClick={() => checkIn(d.factoryOrgId)} disabled={pending} className="flex-1">I&apos;m here</Button>
                  ) : !d.checkOutTime ? (
                    <Button variant="outline" onClick={() => checkOut(d.factoryOrgId)} disabled={pending} className="flex-1">Check out</Button>
                  ) : (
                    <span className="rounded-md bg-success-50 px-3 py-1 text-xs text-success-700">Done for today</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {slips.length > 0 && (
        <section className="rounded-2xl bg-white p-5 text-neutral-900 shadow-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-700">Recent payslips</h2>
          <div className="mt-3 space-y-2">
            {slips.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
                <div>
                  <div className="font-semibold text-brand-900">{s.period}</div>
                  <div className="text-xs text-neutral-500">₹{s.netRupees.toLocaleString('en-IN')} · {s.status}</div>
                </div>
                <button
                  type="button"
                  onClick={() => openSlip(s)}
                  disabled={pending}
                  className="rounded-md border border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
                >
                  PDF
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
