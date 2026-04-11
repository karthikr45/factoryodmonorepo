import { cookies } from 'next/headers';

import { apiCallServer } from '@/lib/api';
import { ACCESS_COOKIE } from '@/lib/auth';

import { NewOrderForm } from './new-order-form';

interface Customer {
  id: string;
  name: string;
  phone: string;
}

async function fetchCustomers(): Promise<Customer[]> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  return apiCallServer<Customer[]>('/customers', { accessToken: token });
}

export default async function NewOrderPage(): Promise<JSX.Element> {
  const customers = await fetchCustomers().catch(() => [] as Customer[]);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-brand-900">New order</h1>
      <p className="mt-2 text-neutral-600">
        Create an order for an existing customer, or add a new one.
      </p>
      <NewOrderForm customers={customers} />
    </div>
  );
}
