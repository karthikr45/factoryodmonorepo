import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { getAccessToken } from '../src/lib/storage';

export default function Index(): JSX.Element {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    void (async (): Promise<void> => {
      const token = await getAccessToken();
      if (!token) {
        router.replace('/(auth)/login');
      } else {
        // We could decode the JWT here for role routing, but the simplest option
        // is to land on the factory dashboard and let a profile fetch redirect.
        router.replace('/(factory)');
      }
      setChecking(false);
    })();
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-brand-900">
      {checking ? <ActivityIndicator color="#ffffff" /> : null}
    </View>
  );
}
