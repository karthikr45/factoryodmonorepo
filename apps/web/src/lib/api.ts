/**
 * Axios instance pointing at the NestJS API.
 * Request + response interceptors handle auth token injection and error normalisation.
 */
import axios, { AxiosInstance } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const api: AxiosInstance = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: true,
  timeout: 20_000,
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // TODO: surface toast, redirect on 401, etc. once we have a toast provider.
    return Promise.reject(error);
  },
);
