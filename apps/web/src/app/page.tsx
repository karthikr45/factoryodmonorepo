import Link from 'next/link';

export default function LandingPage(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold text-brand-900 sm:text-5xl">FactoryOS</h1>
        <p className="mt-4 text-lg text-brand-700">
          Run your factory. Your books write themselves.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-brand-700 px-6 py-3 font-semibold text-white hover:bg-brand-800"
          >
            Sign in
          </Link>
          <Link
            href="/factory"
            className="rounded-md border border-brand-300 px-6 py-3 font-semibold text-brand-700 hover:bg-brand-100"
          >
            Factory portal
          </Link>
          <Link
            href="/agency"
            className="rounded-md border border-brand-300 px-6 py-3 font-semibold text-brand-700 hover:bg-brand-100"
          >
            Agency portal
          </Link>
          <Link
            href="/ca"
            className="rounded-md border border-brand-300 px-6 py-3 font-semibold text-brand-700 hover:bg-brand-100"
          >
            CA portal
          </Link>
        </div>
      </div>
    </main>
  );
}
