import Link from 'next/link';

export default function PeopleLandingPage(): JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">People</h1>
      <p className="mt-1 text-neutral-600">
        Everyone who works at your factory — direct staff and contract workers
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/factory/people/employees" className="group rounded-lg border border-neutral-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-xl">👥</div>
          <h2 className="mt-4 text-lg font-semibold text-brand-900 group-hover:text-brand-700">Employees</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Manage your direct staff (managers, operators) and see contract workers from agencies in one place.
          </p>
        </Link>

        <Link href="/factory/people/attendance" className="group rounded-lg border border-neutral-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-xl">⏱️</div>
          <h2 className="mt-4 text-lg font-semibold text-brand-900 group-hover:text-brand-700">Attendance</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Review and approve attendance marked by your staffing agencies. Wages auto-post to your books.
          </p>
        </Link>
      </div>
    </div>
  );
}
