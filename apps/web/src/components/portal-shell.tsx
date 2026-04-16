'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LogoutButton } from './logout-button';

interface NavItem {
  href: string;
  label: string;
}

interface PortalShellProps {
  portalName: string;
  accent: 'brand' | 'accent';
  nav: NavItem[];
  children: React.ReactNode;
}

/**
 * Responsive portal shell.
 *  - ≥lg (1024+): permanent left sidebar.
 *  - <lg: collapsing top bar with hamburger; sidebar slides in as a drawer.
 *
 * The drawer auto-closes on route change so the user doesn't have to manually
 * dismiss it after tapping a nav link on mobile.
 */
export function PortalShell({ portalName, accent, nav, children }: PortalShellProps): JSX.Element {
  const accentBg = accent === 'brand' ? 'bg-brand-900' : 'bg-accent-600';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock background scroll while drawer is open on mobile.
  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
    return;
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 lg:flex-row">
      {/* Mobile top bar */}
      <header className={`flex items-center justify-between px-4 py-3 ${accentBg} text-white lg:hidden`}>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-white/60">FactoryOS</span>
          <span className="text-sm font-semibold">· {portalName}</span>
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen((o) => !o)}
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          className="rounded-md border border-white/20 p-2 text-white hover:bg-white/10"
        >
          {drawerOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M6 18L18 6" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" /></svg>
          )}
        </button>
      </header>

      {/* Sidebar — permanent on lg, drawer on smaller */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col ${accentBg} text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          drawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="hidden border-b border-white/10 px-6 py-5 lg:block">
          <Link href="/" className="text-xs uppercase tracking-wider text-white/60 hover:text-white/80">
            FactoryOS
          </Link>
          <div className="mt-1 text-lg font-semibold">{portalName}</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {nav.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <LogoutButton />
          <a
            href="https://mktechmonk.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block px-3 text-center text-xs text-white/40 hover:text-white/70"
          >
            Powered by <span className="font-semibold text-white/70">MK Tech Monk</span>
          </a>
        </div>
      </aside>

      {/* Drawer backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}

      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
