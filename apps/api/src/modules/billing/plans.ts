/**
 * Subscription plan catalog.
 *
 * Each plan maps to a Razorpay Plan ID (rzpPlanId env override) so we can
 * change pricing without touching this file. The amount and interval are
 * still defined here so the UI can render a comparison table without an
 * extra Razorpay round-trip.
 */

export interface PlanDescriptor {
  id: 'FREE' | 'PRO' | 'GROWTH' | 'ENTERPRISE';
  label: string;
  monthlyPaise: number;
  features: string[];
  /** Set on Razorpay → store the plan_xxx id in env. Empty for self-managed. */
  rzpPlanIdEnv: string | null;
  /** When true, you can't auto-subscribe; sales must enable it. */
  requiresSales: boolean;
}

export const PLANS: PlanDescriptor[] = [
  {
    id: 'FREE',
    label: 'Free',
    monthlyPaise: 0,
    features: [
      'Up to 5 users',
      'Up to 50 orders / month',
      '1 workflow template',
      'WhatsApp notifications',
    ],
    rzpPlanIdEnv: null,
    requiresSales: false,
  },
  {
    id: 'PRO',
    label: 'Pro',
    monthlyPaise: 1_99_900, // ₹1,999/mo
    features: [
      'Up to 25 users',
      'Unlimited orders',
      'Unlimited workflow templates',
      'Approval rules',
      'PDF invoice / quotation / salary slip',
      'Priority WhatsApp support',
    ],
    rzpPlanIdEnv: 'RZP_PLAN_PRO',
    requiresSales: false,
  },
  {
    id: 'GROWTH',
    label: 'Growth',
    monthlyPaise: 4_99_900, // ₹4,999/mo
    features: [
      'Up to 100 users',
      'Custom roles & fine-grained permissions',
      'GST filing automation',
      'E-invoicing (IRP)',
      'CSV bulk import',
      'Sentry-grade observability',
    ],
    rzpPlanIdEnv: 'RZP_PLAN_GROWTH',
    requiresSales: false,
  },
  {
    id: 'ENTERPRISE',
    label: 'Enterprise',
    monthlyPaise: 0, // negotiated
    features: [
      'Unlimited users',
      'Dedicated cloud / on-prem',
      'SSO + SCIM',
      'Custom contract & SLA',
      'White-glove onboarding',
    ],
    rzpPlanIdEnv: null,
    requiresSales: true,
  },
];

export function getPlan(id: string): PlanDescriptor | undefined {
  return PLANS.find((p) => p.id === id);
}
