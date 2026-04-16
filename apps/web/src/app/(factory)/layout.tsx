import { AIAssistantButton } from '@/components/ai-assistant';
import { OnboardingTour } from '@/components/onboarding-tour';
import { PortalShell } from '@/components/portal-shell';

const nav = [
  { href: '/factory', label: 'Dashboard' },
  { href: '/factory/orders', label: 'Orders' },
  { href: '/factory/people', label: 'People' },
  { href: '/factory/inventory', label: 'Inventory' },
  { href: '/factory/money', label: 'Money' },
  { href: '/factory/workflows', label: 'Workflows' },
  { href: '/factory/roles', label: 'Roles' },
  { href: '/factory/approvals', label: 'Approvals' },
  { href: '/factory/imports', label: 'Imports' },
  { href: '/factory/billing', label: 'Billing' },
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
      <AIAssistantButton />
      <OnboardingTour />
    </PortalShell>
  );
}
