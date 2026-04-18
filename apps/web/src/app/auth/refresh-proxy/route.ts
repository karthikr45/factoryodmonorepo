/**
 * Tiny proxy the client hits when axios sees a 401. We can't call the server
 * action from axios directly because action POSTs need a framework id in the
 * body; this plain POST handler just reads the httpOnly refresh cookie,
 * exchanges it for a new access token via the NestJS API, and writes the new
 * cookies back before responding with the raw token.
 */
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { AuthTokens } from '@repo/types';

import { apiCallServer } from '@/lib/api';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth';

export async function POST(): Promise<NextResponse> {
  const store = await cookies();
  const rt = store.get(REFRESH_COOKIE)?.value;
  if (!rt) return NextResponse.json({ ok: false }, { status: 200 });

  let tokens: AuthTokens;
  try {
    tokens = await apiCallServer<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: rt }),
    });
  } catch {
    store.delete(ACCESS_COOKIE);
    store.delete(REFRESH_COOKIE);
    return NextResponse.json({ ok: false }, { status: 200 });
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
  return NextResponse.json({ ok: true, accessToken: tokens.accessToken });
}
