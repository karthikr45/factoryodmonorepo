import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';

import { LogoutButton } from '@/components/logout-button';

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* Top bar — branding + logout */}
      <header className="border-b border-neutral-200 bg-brand-900 text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/60">FactoryOS</div>
            <div className="font-semibold">{user.name}</div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-2xl flex-1 p-4 pb-24">{children}</main>

      {/* Bottom tab bar — thumb-friendly for phones */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-2xl justify-around">
          <TabLink href="/worker" label="Home" icon="🏠" />
          <TabLink href="/worker/tasks" label="My tasks" icon="📋" />
          <TabLink href="/worker/attendance" label="Attendance" icon="📅" />
        </div>
      </nav>

      {/* Powered by */}
      <div className="fixed bottom-20 right-3 text-[10px] text-neutral-400">
        Powered by <a href="https://mktechmonk.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-brand-700">MK Tech Monk</a>
      </div>
    </div>
  );
}

function TabLink({ href, label, icon }: { href: string; label: string; icon: string }): JSX.Element {
  return (
    <Link href={href} className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-neutral-600 transition hover:text-brand-700">
      <span className="text-2xl leading-none">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
