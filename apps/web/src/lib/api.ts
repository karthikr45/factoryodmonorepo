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
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
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

api.interceptors.response.use(
  (response) => response,
  (error: {
    response?: AxiosResponse<ErrorResponse>;
    message: string;
  }) => {
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
