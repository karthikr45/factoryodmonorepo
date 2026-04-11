import { cookies } from 'next/headers';
import Link from 'next/link';

import { OrderStatus } from '@repo/types';

import { apiCallServer } from '@/lib/api';
import { ACCESS_COOKIE } from '@/lib/auth';
import { formatINR, formatIST } from '@/lib/utils';

import { OrderActions } from './order-actions';

interface OrderDetail {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  unit: string;
  status: OrderStatus;
  deliveryDate: string;
  totalValue: number;
  advancePaid: number;
  customer: { id: string; name: string };
  notes: string | null;
  jobCards: Array<{
    id: string;
    status: string;
    department: { id: string; name: string; sequence: number };
    assignedTo: string | null;
  }>;
}

async function fetchOrder(id: string): Promise<OrderDetail> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  return apiCallServer<OrderDetail>(`/orders/${id}`, { accessToken: token });
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  const order = await fetchOrder(id);
  const outstanding = order.totalValue - order.advancePaid;

  return (
    <div>
      <Link href="/factory/orders" className="text-sm text-brand-700 hover:underline">
        ← Back to orders
      </Link>
      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Order {order.orderNumber}</h1>
          <p className="mt-1 text-neutral-600">
            {order.customer.name} · {order.productName} · {order.quantity} {order.unit}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-neutral-500">Delivery by</div>
          <div className="font-semibold">{formatIST(order.deliveryDate)}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wider text-neutral-500">Total value</div>
          <div className="mt-1 text-xl font-semibold">{formatINR(order.totalValue)}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wider text-neutral-500">Advance received</div>
          <div className="mt-1 text-xl font-semibold">{formatINR(order.advancePaid)}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wider text-neutral-500">Outstanding</div>
          <div className="mt-1 text-xl font-semibold text-accent-600">
            {formatINR(outstanding)}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Status
        </h2>
        <div className="mt-2 text-lg font-semibold">{order.status.replace('_', ' ')}</div>
        <OrderActions id={order.id} currentStatus={order.status} />
      </div>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Production pipeline
        </h2>
        {order.jobCards.length === 0 ? (
          <p className="mt-3 text-neutral-500">
            No job cards yet. Confirm the order and then generate job cards.
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {order.jobCards.map((jc) => (
              <li
                key={jc.id}
                className="flex items-center justify-between rounded border border-neutral-100 px-3 py-2"
              >
                <div>
                  <div className="text-xs text-neutral-500">
                    Stage {jc.department.sequence}
                  </div>
                  <div className="font-medium">{jc.department.name}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    jc.status === 'COMPLETED'
                      ? 'bg-success-50 text-success-700'
                      : jc.status === 'IN_PROGRESS'
                        ? 'bg-warning-50 text-warning-700'
                        : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {jc.status}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {order.notes ? (
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-neutral-700">{order.notes}</p>
        </div>
      ) : null}
    </div>
  );
}
