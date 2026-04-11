import { cookies } from 'next/headers';

import { apiCallServer } from '@/lib/api';
import { ACCESS_COOKIE } from '@/lib/auth';

import { AttendanceGrid } from './attendance-grid';

interface Deployment {
  id: string;
  worker: { id: string; name: string; skill: string };
  factoryOrgId: string;
  startDate: string;
}

async function fetchActiveDeployments(): Promise<Deployment[]> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  return apiCallServer<Deployment[]>('/workers/deployments?as=agency', {
    accessToken: token,
  });
}

export default async function AgencyAttendancePage(): Promise<JSX.Element> {
  const deployments = await fetchActiveDeployments().catch(() => [] as Deployment[]);
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Mark daily attendance</h1>
      <p className="mt-2 text-neutral-600">
        Select a date, mark each worker, and submit. The factory owner will approve.
      </p>
      <AttendanceGrid deployments={deployments} />
    </div>
  );
}
