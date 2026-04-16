import { PortalShell } from '@/components/portal-shell';

const nav = [
  { href: '/worker', label: 'Home' },
  { href: '/worker/tasks', label: 'My tasks' },
  { href: '/worker/attendance', label: 'My attendance' },
  { href: '/worker/pay', label: 'My pay' },
  { href: '/worker/chat', label: 'Chat' },
];

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <PortalShell portalName="Worker" accent="brand" nav={nav}>
      {children}
    </PortalShell>
  );
}
