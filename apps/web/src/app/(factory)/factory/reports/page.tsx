'use client';

import { useQuery } from '@tanstack/react-query';

import { apiCall } from '@/lib/api';
import { formatINR } from '@/lib/utils';

interface ProfitRow {
  orderId: string;
  orderNumber: string;
  customer: string;
  revenue: number;
  estimatedCost: number;
  profit: number;
  margin: number;
}

interface CashFlow {
  inflow: number;
  outflow: number;
  net: number;
  daily: Array<{ date: string; inflow: number; outflow: number }>;
}

export default function ReportsPage(): JSX.Element {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today = now.toISOString().slice(0, 10);

  const { data: profit } = useQuery<ProfitRow[]>({
    queryKey: ['profit-per-order'],
    queryFn: () =>
      apiCall<ProfitRow[]>({ url: `/reports/profit-per-order?from=${monthStart}&to=${today}` }),
  });

  const { data: cashFlow } = useQuery<CashFlow>({
    queryKey: ['cash-flow'],
    queryFn: () =>
      apiCall<CashFlow>({ url: `/reports/cash-flow?from=${monthStart}&to=${today}` }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Reports</h1>
      <p className="mt-1 text-neutral-600">Current month: {monthStart} to {today}</p>

      {/* Cash flow summary */}
      {cashFlow && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Cash flow</h2>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="text-xs uppercase tracking-wider text-neutral-500">Inflow</div>
              <div className="mt-1 text-2xl font-semibold text-success-700">{formatINR(cashFlow.inflow)}</div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="text-xs uppercase tracking-wider text-neutral-500">Outflow</div>
              <div className="mt-1 text-2xl font-semibold text-danger-700">{formatINR(cashFlow.outflow)}</div>
            </div>
            <div className={`rounded-lg border p-5 ${cashFlow.net >= 0 ? 'border-success-200 bg-success-50' : 'border-danger-200 bg-danger-50'}`}>
              <div className="text-xs uppercase tracking-wider text-neutral-500">Net</div>
              <div className={`mt-1 text-2xl font-semibold ${cashFlow.net >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                {formatINR(Math.abs(cashFlow.net))}
              </div>
            </div>
          </div>

          {cashFlow.daily.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left"><tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium text-right">Inflow</th>
                  <th className="px-4 py-2 font-medium text-right">Outflow</th>
                  <th className="px-4 py-2 font-medium text-right">Net</th>
                </tr></thead>
                <tbody className="divide-y divide-neutral-100">
                  {cashFlow.daily.map((d) => (
                    <tr key={d.date}>
                      <td className="px-4 py-2">{d.date}</td>
                      <td className="px-4 py-2 text-right text-success-700">{d.inflow > 0 ? formatINR(d.inflow) : '—'}</td>
                      <td className="px-4 py-2 text-right text-danger-700">{d.outflow > 0 ? formatINR(d.outflow) : '—'}</td>
                      <td className="px-4 py-2 text-right font-semibold">{formatINR(d.inflow - d.outflow)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Profit per order */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Profit per order</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left"><tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium text-right">Revenue</th>
              <th className="px-4 py-3 font-medium text-right">Est. cost</th>
              <th className="px-4 py-3 font-medium text-right">Profit</th>
              <th className="px-4 py-3 font-medium text-right">Margin</th>
            </tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {(profit ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                  No dispatched orders this month yet
                </td></tr>
              ) : (profit ?? []).map((r) => (
                <tr key={r.orderId}>
                  <td className="px-4 py-3 font-semibold">{r.orderNumber}</td>
                  <td className="px-4 py-3">{r.customer}</td>
                  <td className="px-4 py-3 text-right">{formatINR(r.revenue)}</td>
                  <td className="px-4 py-3 text-right">{formatINR(r.estimatedCost)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${r.profit >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                    {formatINR(Math.abs(r.profit))}
                  </td>
                  <td className="px-4 py-3 text-right">{r.margin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
