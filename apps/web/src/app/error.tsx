'use client';

import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-6 text-white">
      <div className="max-w-lg text-center">
        <div className="text-7xl">⚠️</div>
        <h1 className="mt-4 text-3xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-white/70">
          We&apos;ve been notified and are looking into it. You can try again or come back later.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-white/40">Reference: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={reset}
            className="rounded-lg bg-gradient-to-r from-highlight-400 to-brand-600 px-6 py-3 font-semibold text-white shadow-lg shadow-highlight-400/30">
            Try again
          </button>
          <Link href="/" className="rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur hover:bg-white/10">
            Back to home
          </Link>
          <Link href="/contact" className="rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur hover:bg-white/10">
            Contact support
          </Link>
        </div>
      </div>
    </main>
  );
}
