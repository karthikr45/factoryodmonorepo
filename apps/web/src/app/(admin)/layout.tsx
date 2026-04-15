import { PortalShell } from '@/components/portal-shell';

const nav = [
  { href: '/admin', label: 'Platform' },
  { href: '/admin/organisations', label: 'Organisations' },
  { href: '/admin/contact', label: 'Contact submissions' },
  { href: '/admin/content', label: 'Marketing content' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <PortalShell portalName="Platform Admin" accent="brand" nav={nav}>
      {children}
    </PortalShell>
  );
}
