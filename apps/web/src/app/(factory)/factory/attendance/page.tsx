import { cookies } from 'next/headers';

import { apiCallServer } from '@/lib/api';
import { ACCESS_COOKIE } from '@/lib/auth';

import { AttendanceApproval } from './attendance-approval';

interface Record {
  id: string;
  worker: { id: string; name: string };
  date: string;
  status: string;
  overtime: number;
  approvedAt: string | null;
  isDisputed: boolean;
  disputeNote: string | null;
}

async function fetchPending(): Promise<Record[]> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  return apiCallServer<Record[]>('/attendance?as=factory&onlyPending=true', {
    accessToken: token,
  });
}

export default async function FactoryAttendancePage(): Promise<JSX.Element> {
  const records = await fetchPending().catch(() => [] as Record[]);
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Approve attendance</h1>
      <p className="mt-2 text-neutral-600">
        Review what the staffing agency has marked. Approved records auto-post to the wages ledger.
      </p>
      <AttendanceApproval records={records} />
    </div>
  );
}
