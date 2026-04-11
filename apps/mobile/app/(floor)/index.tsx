import { Text, View } from 'react-native';

export default function FloorHome(): JSX.Element {
  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold text-brand-900">Job cards</Text>
      <Text className="mt-2 text-neutral-600">
        Tap a job card to mark a stage complete.
      </Text>
    </View>
  );
}
