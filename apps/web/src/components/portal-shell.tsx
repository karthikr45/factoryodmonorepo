import Link from 'next/link';

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

export function PortalShell({ portalName, accent, nav, children }: PortalShellProps): JSX.Element {
  const accentBg = accent === 'brand' ? 'bg-brand-900' : 'bg-accent-600';

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className={`flex w-64 flex-col ${accentBg} text-white`}>
        <div className="border-b border-white/10 px-6 py-5">
          <Link href="/" className="text-xs uppercase tracking-wider text-white/60 hover:text-white/80">
            FactoryOS
          </Link>
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
        <div className="border-t border-white/10 p-4">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
