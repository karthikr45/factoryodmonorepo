import { PortalShell } from '@/components/portal-shell';

const nav = [
  { href: '/factory', label: 'Dashboard' },
  { href: '/factory/orders', label: 'Orders' },
  { href: '/factory/production', label: 'Production' },
  { href: '/factory/procurement', label: 'Procurement' },
  { href: '/factory/attendance', label: 'Attendance' },
  { href: '/factory/finance', label: 'Finance' },
  { href: '/factory/reports', label: 'Reports' },
];

export default function FactoryLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <PortalShell portalName="Factory" accent="brand" nav={nav}>
      {children}
    </PortalShell>
  );
}
