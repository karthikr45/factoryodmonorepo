import { cookies } from 'next/headers';

import { apiCallServer } from '@/lib/api';
import { ACCESS_COOKIE } from '@/lib/auth';
import { formatIST } from '@/lib/utils';

import { GenerateReturnButton } from './generate-return';

interface GSTReturn {
  id: string;
  period: string;
  type: string;
  status: string;
  filedAt: string | null;
}

async function fetchReturns(): Promise<GSTReturn[]> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  return apiCallServer<GSTReturn[]>('/compliance/gst-returns', {
    accessToken: token,
  });
}

export default async function CaGstPage(): Promise<JSX.Element> {
  const returns = await fetchReturns().catch(() => [] as GSTReturn[]);
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">GST Returns</h1>
        <GenerateReturnButton />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Filed at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {returns.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-neutral-500">
                  No GST returns yet. Click &quot;Generate&quot; to draft one.
                </td>
              </tr>
            ) : (
              returns.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-mono">{r.period}</td>
                  <td className="px-4 py-3">{r.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.status === 'FILED'
                          ? 'bg-success-50 text-success-700'
                          : 'bg-warning-50 text-warning-700'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {r.filedAt ? formatIST(r.filedAt) : '—'}
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
