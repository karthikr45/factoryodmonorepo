import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';

import { apiCall } from '../../src/lib/api';

interface JobCard {
  id: string;
  status: string;
  department: { id: string; name: string; sequence: number };
  order: { id: string; orderNumber: string; productName: string };
}

export default function FloorHome(): JSX.Element {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<JobCard[]>({
    queryKey: ['my-jobcards'],
    queryFn: () => apiCall<JobCard[]>({ url: '/production/job-cards?status=PENDING' }),
  });

  const start = async (id: string): Promise<void> => {
    await apiCall({
      url: `/production/job-cards/${id}/status`,
      method: 'POST',
      data: { status: 'IN_PROGRESS' },
    });
    qc.invalidateQueries({ queryKey: ['my-jobcards'] });
  };

  const complete = async (id: string): Promise<void> => {
    await apiCall({
      url: `/production/job-cards/${id}/status`,
      method: 'POST',
      data: { status: 'COMPLETED' },
    });
    qc.invalidateQueries({ queryKey: ['my-jobcards'] });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <View className="bg-brand-900 px-6 py-8">
        <Text className="text-sm text-white/70">Today</Text>
        <Text className="mt-1 text-2xl font-bold text-white">Job cards</Text>
      </View>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          <Text className="mt-12 text-center text-neutral-500">
            No pending job cards.
          </Text>
        }
        renderItem={({ item }) => (
          <View className="rounded-lg border border-neutral-200 bg-white p-4">
            <Text className="text-xs uppercase text-neutral-500">
              Stage {item.department.sequence} · {item.department.name}
            </Text>
            <Text className="mt-1 text-lg font-semibold text-brand-900">
              {item.order.orderNumber}
            </Text>
            <Text className="text-neutral-700">{item.order.productName}</Text>
            <View className="mt-3 flex-row gap-2">
              {item.status === 'PENDING' ? (
                <TouchableOpacity
                  onPress={() => void start(item.id)}
                  className="flex-1 rounded-md bg-brand-700 px-3 py-2"
                >
                  <Text className="text-center font-semibold text-white">Start</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => void complete(item.id)}
                  className="flex-1 rounded-md bg-success-500 px-3 py-2"
                >
                  <Text className="text-center font-semibold text-white">
                    Mark complete
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}
