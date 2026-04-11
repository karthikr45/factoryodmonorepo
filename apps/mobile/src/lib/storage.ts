/**
 * Storage wrapper for mobile.
 *
 * - MMKV for general offline data (fast, synchronous, perfect for 4G edge caching).
 * - Expo SecureStore for auth tokens (hardware-backed keystore on Android).
 */
import * as SecureStore from 'expo-secure-store';
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'factoryos-cache' });

const ACCESS_KEY = 'factoryos.accessToken';
const REFRESH_KEY = 'factoryos.refreshToken';

export async function setAuthTokens(accessToken: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearAuthTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
