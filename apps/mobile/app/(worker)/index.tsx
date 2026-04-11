import { Text, View } from 'react-native';

export default function WorkerHome(): JSX.Element {
  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold text-brand-900">My attendance</Text>
      <Text className="mt-2 text-neutral-600">
        This month&apos;s days worked and salary slip.
      </Text>
    </View>
  );
}
