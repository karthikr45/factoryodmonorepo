import { PortalShell } from '@/components/portal-shell';

const nav = [
  { href: '/worker', label: 'Home' },
  { href: '/worker/tasks', label: 'My tasks' },
  { href: '/worker/attendance', label: 'My attendance' },
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
