import { PortalShell } from '@/components/portal-shell';

const nav = [
  { href: '/ca', label: 'Dashboard' },
  { href: '/ca/clients', label: 'Clients' },
  { href: '/ca/books', label: 'Live Books' },
  { href: '/ca/gst', label: 'GST Returns' },
  { href: '/ca/audits', label: 'Audits' },
  { href: '/ca/queries', label: 'Queries' },
];

export default function CaLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <PortalShell portalName="CA / Auditor" accent="brand" nav={nav}>
      {children}
    </PortalShell>
  );
}
