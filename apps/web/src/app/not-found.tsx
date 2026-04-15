import Link from 'next/link';

export default function NotFound(): JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-6 text-white">
      <div className="text-center">
        <div className="text-9xl font-extrabold opacity-30">404</div>
        <h1 className="mt-4 text-4xl font-bold">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-white/70">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-lg bg-gradient-to-r from-highlight-400 to-brand-600 px-6 py-3 font-semibold text-white shadow-lg shadow-highlight-400/30">
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
