'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { AuthTokens } from '@repo/types';
import { requestOtpSchema, verifyOtpSchema } from '@repo/validators';

import { apiCallServer } from '@/lib/api';
import { ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE } from '@/lib/auth';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function requestOtpAction(formData: FormData): Promise<ActionResult> {
  const parsed = requestOtpSchema.safeParse({ phone: formData.get('phone') });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid phone' };
  }
  try {
    await apiCallServer('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to send OTP',
    };
  }
}

export async function verifyOtpAction(formData: FormData): Promise<ActionResult> {
  const inviteToken = formData.get('inviteToken');
  const parsed = verifyOtpSchema.safeParse({
    phone: formData.get('phone'),
    code: formData.get('code'),
    ...(inviteToken ? { inviteToken: String(inviteToken) } : {}),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid code' };
  }

  let result: {
    tokens: AuthTokens;
    user: { id: string; orgId: string; name: string; role: string };
  };
  try {
    result = await apiCallServer('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Verification failed',
    };
  }

  const store = await cookies();
  const common = {
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
  store.set(ACCESS_COOKIE, result.tokens.accessToken, {
    ...common,
    maxAge: result.tokens.expiresIn,
  });
  store.set(REFRESH_COOKIE, result.tokens.refreshToken, {
    ...common,
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  });
  store.set(USER_COOKIE, JSON.stringify(result.user), { ...common, maxAge: 60 * 60 * 24 });

  // Unregistered users land on onboarding first.
  // Our backend creates a placeholder (isActive=false) org for brand-new numbers.
  let needsOnboarding = false;
  try {
    const me = await apiCallServer<{
      organisation: { isActive: boolean };
    }>('/auth/me', { accessToken: result.tokens.accessToken });
    needsOnboarding = !me.organisation.isActive;
  } catch {
    // If /auth/me fails (network, etc.) we still proceed to role routing.
  }
  if (needsOnboarding) {
    redirect('/onboarding');
  }

  // Route by role
  switch (result.user.role) {
    case 'SUPER_ADMIN':
      redirect('/admin');
    case 'AGENCY_ADMIN':
    case 'AGENCY_SUPERVISOR':
      redirect('/agency');
    case 'CA':
      redirect('/ca');
    case 'WORKER':
      redirect('/worker');
    case 'OWNER':
    case 'MANAGER':
    case 'ACCOUNTANT':
    default:
      redirect('/factory');
  }
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(USER_COOKIE);
  redirect('/login');
}

/**
 * Exchange the (httpOnly) refresh cookie for a fresh access token.
 * Called from the client-side axios interceptor when a request returns 401;
 * the client can't read the httpOnly refresh cookie itself, so it delegates
 * to this server action. Returns the new access token so the axios
 * interceptor can immediately retry the original request with it.
 */
export async function refreshAccessAction(): Promise<{ ok: boolean; accessToken?: string }> {
  const store = await cookies();
  const rt = store.get(REFRESH_COOKIE)?.value;
  if (!rt) return { ok: false };

  let tokens: AuthTokens;
  try {
    tokens = await apiCallServer<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: rt }),
    });
  } catch {
    // Refresh failed — wipe cookies so the next navigation hits /login.
    store.delete(ACCESS_COOKIE);
    store.delete(REFRESH_COOKIE);
    store.delete(USER_COOKIE);
    return { ok: false };
  }

  const common = {
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
  store.set(ACCESS_COOKIE, tokens.accessToken, { ...common, maxAge: tokens.expiresIn });
  store.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...common,
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  });
  return { ok: true, accessToken: tokens.accessToken };
}
