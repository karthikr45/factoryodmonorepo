import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { apiCall } from '../../src/lib/api';

interface Dashboard {
  ordersInProduction: number;
  pendingJobCards: number;
  pendingAttendanceApproval: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  outstandingReceivables: number;
}

function formatInr(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export default function FactoryHome(): JSX.Element {
  const { data, isLoading, error } = useQuery<Dashboard>({
    queryKey: ['dashboard'],
    queryFn: () => apiCall<Dashboard>({ url: '/reports/dashboard' }),
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-danger-700">{(error as Error).message}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="bg-brand-900 px-6 py-8">
        <Text className="text-sm text-white/70">Good day</Text>
        <Text className="mt-1 text-2xl font-bold text-white">Owner Dashboard</Text>
      </View>

      <View className="-mt-4 rounded-t-2xl bg-white px-6 pt-6">
        <View className="rounded-lg border border-neutral-200 p-5">
          <Text className="text-xs uppercase text-neutral-500">Revenue this month</Text>
          <Text className="mt-1 text-2xl font-semibold text-brand-900">
            {formatInr(data?.monthlyRevenue ?? 0)}
          </Text>
        </View>

        <View className="mt-4 flex-row gap-3">
          <Stat label="In production" value={data?.ordersInProduction ?? 0} />
          <Stat label="Pending cards" value={data?.pendingJobCards ?? 0} />
        </View>

        <View className="mt-3 flex-row gap-3">
          <Stat label="Approve attendance" value={data?.pendingAttendanceApproval ?? 0} />
          <Stat label="Outstanding ₹" value={formatInr(data?.outstandingReceivables ?? 0)} />
        </View>
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number | string }): JSX.Element {
  return (
    <View className="flex-1 rounded-lg border border-neutral-200 p-4">
      <Text className="text-xs uppercase text-neutral-500">{label}</Text>
      <Text className="mt-1 text-xl font-semibold text-brand-900">{value}</Text>
    </View>
  );
}
