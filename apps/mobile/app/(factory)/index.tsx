import { Text, View } from 'react-native';

export default function FactoryHome(): JSX.Element {
  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold text-brand-900">Owner dashboard</Text>
      <Text className="mt-2 text-neutral-600">
        Orders, production, and approvals at a glance.
      </Text>
    </View>
  );
}
