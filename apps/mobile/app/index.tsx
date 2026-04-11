import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function Landing(): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-brand-900 px-6">
      <Text className="text-4xl font-bold text-white">FactoryOS</Text>
      <Text className="mt-3 text-base text-white/70">
        Run your factory from your phone.
      </Text>
      <Link href="/(auth)/login" className="mt-10 rounded-md bg-accent-500 px-6 py-3">
        <Text className="font-semibold text-white">Sign in</Text>
      </Link>
    </View>
  );
}
