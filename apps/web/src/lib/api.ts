/**
 * Shared API client for FactoryOS web.
 *
 * - Wraps the NestJS API at /api.
 * - Reads the access token from an httpOnly cookie on the server side
 *   (via Next.js cookies()), or from the browser-accessible "factoryos_at"
 *   cookie on the client (set by our /login flow after OTP verify).
 * - Unwraps the ApiResponse<T> envelope automatically.
 */
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { ApiResponse, ErrorResponse } from '@repo/types';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function readClientToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('factoryos_at='));
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : null;
}

export const api: AxiosInstance = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: true,
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = readClientToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Single-flight refresh. A burst of 401s (e.g. parallel react-query fetches)
 * triggers exactly one refresh call; all waiters resolve to the same new token.
 */
let refreshInFlight: Promise<string | null> | null = null;
async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch('/auth/refresh-proxy', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { ok: boolean; accessToken?: string };
      return body.ok && body.accessToken ? body.accessToken : null;
    } catch {
      return null;
    } finally {
      // Clear after a micro-delay so tests still see the pending promise if
      // they await immediately after triggering a second 401.
      setTimeout(() => { refreshInFlight = null; }, 0);
    }
  })();
  return refreshInFlight;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const status = error.response?.status;
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    // On 401 — try to refresh ONCE, then retry the original request.
    if (status === 401 && original && !original._retried) {
      original._retried = true;
      const fresh = await refreshAccessToken();
      if (fresh) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${fresh}`;
        return api.request(original);
      }
      // Refresh failed → cookies have been wiped server-side; kick to login.
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    const message =
      error.response?.data?.error?.message ?? error.message ?? 'Request failed';
    return Promise.reject(new Error(message));
  },
);

/**
 * Typed helper that unwraps the NestJS ApiResponse<T> envelope.
 * Use this for every mutation + query so callers deal with T, not { success, data }.
 */
export async function apiCall<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api.request<ApiResponse<T>>(config);
  return res.data.data;
}

/**
 * Server-side API call — reads the cookie from Next.js headers and calls the API directly.
 * Use inside Server Components / Route Handlers.
 */
export async function apiCallServer<T>(
  path: string,
  init: RequestInit & { accessToken?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.accessToken) {
    headers.Authorization = `Bearer ${init.accessToken}`;
  }
  const res = await fetch(`${baseURL}/api${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  const json = (await res.json()) as ApiResponse<T> | ErrorResponse;
  if (!res.ok || !('success' in json) || !json.success) {
    const msg =
      'error' in json ? json.error.message : `Request failed with status ${res.status}`;
    throw new Error(msg);
  }
  return json.data;
}
