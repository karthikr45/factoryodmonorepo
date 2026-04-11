import Link from 'next/link';

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
 * Shared chrome for the factory, agency, and CA portals.
 * Placeholder sidebar + top bar. Replace with shadcn/ui components once auth is wired in.
 */
export function PortalShell({ portalName, accent, nav, children }: PortalShellProps): JSX.Element {
  const accentBg = accent === 'brand' ? 'bg-brand-900' : 'bg-accent-600';

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className={`flex w-64 flex-col ${accentBg} text-white`}>
        <div className="border-b border-white/10 px-6 py-5">
          <div className="text-xs uppercase tracking-wider text-white/60">FactoryOS</div>
          <div className="mt-1 text-lg font-semibold">{portalName}</div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 px-6 py-4 text-xs text-white/60">v0.1.0</div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
