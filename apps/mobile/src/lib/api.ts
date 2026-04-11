/**
 * Axios instance for the mobile app.
 * Reads API base URL from Expo public env vars and attaches the JWT from SecureStore.
 */
import axios, { AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import Constants from 'expo-constants';

import type { ApiResponse, ErrorResponse } from '@repo/types';

import { getAccessToken } from './storage';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };
const baseURL =
  process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:4000';

export const api: AxiosInstance = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 20_000,
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: { response?: AxiosResponse<ErrorResponse>; message: string }) => {
    const msg =
      error.response?.data?.error?.message ?? error.message ?? 'Request failed';
    return Promise.reject(new Error(msg));
  },
);

export async function apiCall<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await api.request<ApiResponse<T>>(config);
  return res.data.data;
}
