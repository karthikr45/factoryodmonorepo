'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { OrderStatus } from '@repo/types';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';

interface Props {
  id: string;
  currentStatus: OrderStatus;
}

const NEXT: Record<OrderStatus, { label: string; status: OrderStatus }[]> = {
  [OrderStatus.ENQUIRY]: [
    { label: 'Confirm order', status: OrderStatus.CONFIRMED },
    { label: 'Cancel', status: OrderStatus.CANCELLED },
  ],
  [OrderStatus.CONFIRMED]: [
    { label: 'Start production', status: OrderStatus.IN_PRODUCTION },
  ],
  [OrderStatus.IN_PRODUCTION]: [
    { label: 'Send for QC', status: OrderStatus.QUALITY_CHECK },
  ],
  [OrderStatus.QUALITY_CHECK]: [
    { label: 'Mark ready', status: OrderStatus.READY },
    { label: 'Back to production', status: OrderStatus.IN_PRODUCTION },
  ],
  [OrderStatus.READY]: [
    { label: 'Dispatch (creates invoice)', status: OrderStatus.DISPATCHED },
  ],
  [OrderStatus.DISPATCHED]: [
    { label: 'Mark delivered', status: OrderStatus.DELIVERED },
  ],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function OrderActions({ id, currentStatus }: Props): JSX.Element {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const transitions = NEXT[currentStatus] ?? [];

  const transition = (status: OrderStatus): void => {
    setError(null);
    start(async () => {
      try {
        await apiCall({
          url: `/orders/${id}/status`,
          method: 'POST',
          data: { status },
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to transition');
      }
    });
  };

  const generateJobCards = (): void => {
    setError(null);
    start(async () => {
      try {
        await apiCall({
          url: '/production/job-cards',
          method: 'POST',
          data: { orderId: id },
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate job cards');
      }
    });
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {transitions.map((t) => (
        <Button
          key={t.status}
          onClick={() => transition(t.status)}
          disabled={pending}
          variant={t.status === OrderStatus.CANCELLED ? 'danger' : 'default'}
        >
          {t.label}
        </Button>
      ))}
      {currentStatus === OrderStatus.CONFIRMED ||
      currentStatus === OrderStatus.IN_PRODUCTION ? (
        <Button variant="outline" onClick={generateJobCards} disabled={pending}>
          Generate job cards
        </Button>
      ) : null}
      {error ? (
        <div className="w-full rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
