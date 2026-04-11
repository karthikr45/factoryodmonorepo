import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { apiCall } from '../../src/lib/api';

interface MyAttendance {
  id: string;
  date: string;
  status: string;
  overtime: number;
}

function formatInr(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export default function WorkerHome(): JSX.Element {
  const { data, isLoading } = useQuery<MyAttendance[]>({
    queryKey: ['my-attendance'],
    queryFn: () => apiCall<MyAttendance[]>({ url: '/attendance?as=agency' }),
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  const present = data?.filter((r) => r.status === 'PRESENT').length ?? 0;
  const half = data?.filter((r) => r.status === 'HALF_DAY').length ?? 0;
  const absent = data?.filter((r) => r.status === 'ABSENT').length ?? 0;
  const ot = data?.reduce((a, r) => a + r.overtime, 0) ?? 0;

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="bg-brand-900 px-6 py-8">
        <Text className="text-sm text-white/70">My attendance</Text>
        <Text className="mt-1 text-2xl font-bold text-white">This month</Text>
      </View>

      <View className="-mt-4 rounded-t-2xl bg-white px-6 pt-6">
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-lg bg-success-50 p-4">
            <Text className="text-xs uppercase text-success-700">Present</Text>
            <Text className="mt-1 text-2xl font-bold text-success-700">{present}</Text>
          </View>
          <View className="flex-1 rounded-lg bg-warning-50 p-4">
            <Text className="text-xs uppercase text-warning-700">Half day</Text>
            <Text className="mt-1 text-2xl font-bold text-warning-700">{half}</Text>
          </View>
          <View className="flex-1 rounded-lg bg-danger-50 p-4">
            <Text className="text-xs uppercase text-danger-700">Absent</Text>
            <Text className="mt-1 text-2xl font-bold text-danger-700">{absent}</Text>
          </View>
        </View>

        <View className="mt-4 rounded-lg border border-neutral-200 p-5">
          <Text className="text-xs uppercase text-neutral-500">Overtime hours</Text>
          <Text className="mt-1 text-2xl font-semibold text-brand-900">{ot}</Text>
        </View>

        <Text className="mt-6 text-lg font-semibold text-brand-900">Recent</Text>
        {(data ?? []).slice(0, 10).map((r) => (
          <View
            key={r.id}
            className="mt-2 flex-row items-center justify-between rounded-lg border border-neutral-100 bg-white px-4 py-3"
          >
            <Text className="text-neutral-700">{r.date.slice(0, 10)}</Text>
            <Text className="font-semibold">{r.status}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
