'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { apiCall } from '@/lib/api';
import { formatINR } from '@/lib/utils';

interface MyProfile {
  user: { id: string; name: string; phone: string; role: string };
  profile: {
    designation: string; departmentName: string | null; monthlySalary: number;
    employmentType: string; joiningDate: string;
  } | null;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function WorkerPayPage(): JSX.Element {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useQuery<MyProfile>({
    queryKey: ['my-profile'],
    queryFn: () => apiCall<MyProfile>({ url: '/organisations/employees/me/profile' }),
  });

  const monthName = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">My pay</h1>
        <p className="mt-1 text-sm text-neutral-600">Your salary, designation and downloadable payslips.</p>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-neutral-500">Loading…</div>
      ) : !data?.profile ? (
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-5 text-sm text-warning-800">
          Your profile isn&rsquo;t complete yet. Ask the owner to set your designation + salary.
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-brand-200 bg-white p-5">
            <div className="text-xs uppercase tracking-wider text-brand-700">Profile</div>
            <div className="mt-2 text-lg font-bold text-brand-900">{data.user.name}</div>
            <div className="text-sm text-neutral-700">{data.profile.designation}{data.profile.departmentName ? ` · ${data.profile.departmentName}` : ''}</div>
            <div className="mt-3 text-2xl font-bold text-brand-900">{formatINR(data.profile.monthlySalary)}<span className="text-sm font-normal text-neutral-500">/mo</span></div>
            <div className="mt-1 text-xs text-neutral-500">Joined {new Date(data.profile.joiningDate).toLocaleDateString('en-IN')}</div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="text-xs uppercase tracking-wider text-brand-700">Download payslip</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{new Date(2024, m - 1).toLocaleDateString('en-IN', { month: 'long' })}</option>
                ))}
              </select>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
                {[year - 1, year, year + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <a
                href={`${apiUrl}/api/organisations/employees/me/payslip.pdf?month=${month}&year=${year}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button>Download {monthName}</Button>
              </a>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Slips are generated on the fly from your monthly salary and the days you checked in.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
