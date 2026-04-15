import Link from 'next/link';

import type { Metadata } from 'next';

export function legalMetadata(title: string, description: string): Metadata {
  return {
    title: `${title} · FactoryOS`,
    description,
    robots: { index: true, follow: true },
  };
}

export function LegalShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <main className="min-h-screen bg-white">
      {/* Top nav (mini) */}
      <nav className="border-b border-neutral-100">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-900 text-sm font-bold text-white">F</div>
            <span className="text-lg font-bold text-brand-900">FactoryOS</span>
          </Link>
          <Link href="/" className="text-sm text-neutral-600 hover:text-brand-700">← Back to home</Link>
        </div>
      </nav>

      {/* Content */}
      <article className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-bold text-brand-900">{title}</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: {lastUpdated}</p>
        <div className="prose prose-neutral mt-8 max-w-none prose-headings:text-brand-900 prose-h2:text-2xl prose-h3:text-xl prose-a:text-brand-700 prose-a:no-underline hover:prose-a:underline">
          {children}
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-neutral-100 bg-neutral-50">
        <div className="mx-auto max-w-4xl px-6 py-8 text-center text-sm text-neutral-600">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/privacy" className="hover:text-brand-700">Privacy</Link>
            <Link href="/terms" className="hover:text-brand-700">Terms</Link>
            <Link href="/refund" className="hover:text-brand-700">Refund</Link>
            <Link href="/contact" className="hover:text-brand-700">Contact</Link>
            <Link href="/about" className="hover:text-brand-700">About</Link>
          </div>
          <div className="mt-4 text-xs text-neutral-500">
            © {new Date().getFullYear()} FactoryOS. Built by{' '}
            <a href="https://mktechmonk.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">
              MK Tech Monk
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
