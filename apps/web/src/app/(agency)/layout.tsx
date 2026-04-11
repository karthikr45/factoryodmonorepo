import { PortalShell } from '@/components/portal-shell';

const nav = [
  { href: '/agency', label: 'Dashboard' },
  { href: '/agency/workers', label: 'Workers' },
  { href: '/agency/deployments', label: 'Deployments' },
  { href: '/agency/attendance', label: 'Attendance' },
  { href: '/agency/payroll', label: 'Payroll' },
];

export default function AgencyLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <PortalShell portalName="Staffing Agency" accent="accent" nav={nav}>
      {children}
    </PortalShell>
  );
}
