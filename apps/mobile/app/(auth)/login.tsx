import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen(): JSX.Element {
  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="text-3xl font-bold text-brand-900">Sign in</Text>
      <Text className="mt-2 text-neutral-500">We will send a 6-digit code to your phone.</Text>
      <TextInput
        placeholder="+91 98765 43210"
        keyboardType="phone-pad"
        className="mt-8 rounded-md border border-neutral-300 px-4 py-3 text-base"
      />
      <TouchableOpacity className="mt-4 rounded-md bg-brand-700 px-4 py-3">
        <Text className="text-center font-semibold text-white">Send OTP</Text>
      </TouchableOpacity>
    </View>
  );
}
