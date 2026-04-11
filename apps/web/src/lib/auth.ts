/**
 * Auth helpers for FactoryOS web.
 *
 * We don't use NextAuth — our real auth lives in the NestJS backend (phone + OTP → JWT).
 * This module provides:
 *   - Cookie name constants
 *   - A server-side helper to read the current user from the cookie
 *
 * Cookies are set by the server action in app/(auth)/login/actions.ts and
 * cleared by logoutAction in the same file.
 */
import { cookies } from 'next/headers';

import { apiCallServer } from './api';

export const ACCESS_COOKIE = 'factoryos_at';
export const REFRESH_COOKIE = 'factoryos_rt';
export const USER_COOKIE = 'factoryos_user';

export interface CurrentUser {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  organisation: {
    id: string;
    name: string;
    type: string;
    plan: string;
    isActive: boolean;
  };
}

/**
 * Read the current user from the session cookie, server-side.
 * Returns null if the user isn't logged in.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    return await apiCallServer<CurrentUser>('/auth/me', { accessToken: token });
  } catch {
    return null;
  }
}
