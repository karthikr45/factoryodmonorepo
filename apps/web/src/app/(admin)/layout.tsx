import { PortalShell } from '@/components/portal-shell';

const nav = [
  { href: '/admin', label: 'Platform' },
  { href: '/admin/organisations', label: 'Organisations' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <PortalShell portalName="Platform Admin" accent="brand" nav={nav}>
      {children}
    </PortalShell>
  );
}
