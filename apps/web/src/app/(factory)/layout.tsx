import { PortalShell } from '@/components/portal-shell';

const nav = [
  { href: '/factory', label: 'Dashboard' },
  { href: '/factory/orders', label: 'Orders' },
  { href: '/factory/quotations', label: 'Quotations' },
  { href: '/factory/production', label: 'Production' },
  { href: '/factory/inventory', label: 'Inventory' },
  { href: '/factory/procurement', label: 'Procurement' },
  { href: '/factory/quality', label: 'Quality' },
  { href: '/factory/transport', label: 'Transport' },
  { href: '/factory/employees', label: 'Employees' },
  { href: '/factory/attendance', label: 'Attendance' },
  { href: '/factory/invoices', label: 'Invoices' },
  { href: '/factory/finance', label: 'Finance' },
  { href: '/factory/chat', label: 'Chat' },
  { href: '/factory/reports', label: 'Reports' },
  { href: '/factory/settings', label: 'Settings' },
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
