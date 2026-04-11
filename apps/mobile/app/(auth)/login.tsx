import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { AuthTokens } from '@repo/types';

import { apiCall } from '../../src/lib/api';
import { setAuthTokens } from '../../src/lib/storage';

export default function LoginScreen(): JSX.Element {
  const router = useRouter();
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestOtp = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      await apiCall({ url: '/auth/otp/request', method: 'POST', data: { phone } });
      setStage('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiCall<{
        tokens: AuthTokens;
        user: { role: string };
      }>({ url: '/auth/otp/verify', method: 'POST', data: { phone, code } });
      await setAuthTokens(res.tokens.accessToken, res.tokens.refreshToken);
      switch (res.user.role) {
        case 'OWNER':
        case 'MANAGER':
          router.replace('/(factory)');
          break;
        case 'AGENCY_ADMIN':
          router.replace('/(floor)');
          break;
        case 'WORKER':
          router.replace('/(worker)');
          break;
        default:
          router.replace('/(factory)');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="text-3xl font-bold text-brand-900">Sign in</Text>
      <Text className="mt-2 text-neutral-500">
        {stage === 'phone'
          ? 'Enter your phone — we will send a 6-digit code.'
          : `Enter the code sent to ${phone}`}
      </Text>

      {stage === 'phone' ? (
        <>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            className="mt-8 rounded-md border border-neutral-300 px-4 py-3 text-base"
          />
          <TouchableOpacity
            onPress={requestOtp}
            disabled={loading}
            className="mt-4 rounded-md bg-brand-700 px-4 py-3"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-center font-semibold text-white">Send OTP</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="sms-otp"
            className="mt-8 rounded-md border border-neutral-300 px-4 py-3 text-center text-2xl tracking-[0.5em]"
          />
          <TouchableOpacity
            onPress={verifyOtp}
            disabled={loading || code.length !== 6}
            className="mt-4 rounded-md bg-brand-700 px-4 py-3 disabled:opacity-50"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-center font-semibold text-white">Verify</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStage('phone')} className="mt-3">
            <Text className="text-center text-sm text-brand-700">
              Use a different number
            </Text>
          </TouchableOpacity>
        </>
      )}

      {error ? (
        <Text className="mt-4 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
