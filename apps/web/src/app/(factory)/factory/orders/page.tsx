import Link from 'next/link';
import { cookies } from 'next/headers';

import { OrderStatus } from '@repo/types';

import { apiCallServer } from '@/lib/api';
import { ACCESS_COOKIE } from '@/lib/auth';
import { formatINR, formatIST } from '@/lib/utils';

interface OrderRow {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  unit: string;
  status: OrderStatus;
  deliveryDate: string;
  totalValue: number;
  customer: { id: string; name: string };
  createdAt: string;
}

async function fetchOrders(status?: string): Promise<{ data: OrderRow[]; total: number }> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  const qs = new URLSearchParams({ pageSize: '50', ...(status ? { status } : {}) });
  return apiCallServer<{ data: OrderRow[]; total: number }>(
    `/orders?${qs.toString()}`,
    { accessToken: token },
  );
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.ENQUIRY]: 'bg-neutral-100 text-neutral-700',
  [OrderStatus.CONFIRMED]: 'bg-brand-100 text-brand-800',
  [OrderStatus.IN_PRODUCTION]: 'bg-warning-50 text-warning-700',
  [OrderStatus.QUALITY_CHECK]: 'bg-accent-100 text-accent-800',
  [OrderStatus.READY]: 'bg-success-50 text-success-700',
  [OrderStatus.DISPATCHED]: 'bg-brand-200 text-brand-900',
  [OrderStatus.DELIVERED]: 'bg-success-500 text-white',
  [OrderStatus.CANCELLED]: 'bg-danger-50 text-danger-700',
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}): Promise<JSX.Element> {
  const sp = await searchParams;
  const result = await fetchOrders(sp.status).catch(() => ({ data: [], total: 0 }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Orders</h1>
        <Link
          href="/factory/orders/new"
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          + New order
        </Link>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        <Link
          href="/factory/orders"
          className={`rounded-full border px-3 py-1 text-xs ${
            !sp.status ? 'border-brand-700 bg-brand-700 text-white' : 'border-neutral-200'
          }`}
        >
          All
        </Link>
        {Object.values(OrderStatus).map((s) => (
          <Link
            key={s}
            href={`/factory/orders?status=${s}`}
            className={`rounded-full border px-3 py-1 text-xs ${
              sp.status === s ? 'border-brand-700 bg-brand-700 text-white' : 'border-neutral-200'
            }`}
          >
            {s.replace('_', ' ')}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Delivery</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {result.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-neutral-500">
                  No orders yet. Create your first one.
                </td>
              </tr>
            ) : (
              result.data.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/factory/orders/${o.id}`}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{o.customer.name}</td>
                  <td className="px-4 py-3">
                    {o.productName}{' '}
                    <span className="text-neutral-500">
                      ({o.quantity} {o.unit})
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatINR(o.totalValue)}</td>
                  <td className="px-4 py-3">{formatIST(o.deliveryDate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        STATUS_COLORS[o.status] ?? ''
                      }`}
                    >
                      {o.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
