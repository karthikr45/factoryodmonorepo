import { LegalShell, legalMetadata } from '@/components/legal-shell';

export const metadata = legalMetadata(
  'Refund Policy',
  'Our subscription refund and cancellation policy.',
);

export default function RefundPage(): JSX.Element {
  return (
    <LegalShell title="Refund & Cancellation Policy" lastUpdated="April 2026">
      <h2>Free trial</h2>
      <p>
        FactoryOS Starter is free forever for up to 20 workers and 50 orders per month.
        No credit card required. Try as long as you want before upgrading.
      </p>

      <h2>14-day money-back guarantee (Growth plan)</h2>
      <p>
        If you upgrade to the Growth plan and decide within 14 days that FactoryOS
        isn&apos;t for you, email <a href="mailto:billing@factoryos.in">billing@factoryos.in</a>
        — we&apos;ll refund the full first month, no questions asked.
      </p>

      <h2>After 14 days</h2>
      <ul>
        <li>Cancel anytime in your settings or by emailing us</li>
        <li>Your subscription stops at the end of the current billing cycle</li>
        <li>No refund for the partial month, but you keep access until the cycle ends</li>
        <li>You can export all your data at any time</li>
      </ul>

      <h2>Annual plans</h2>
      <p>
        Pro-rated refund for unused months if you cancel an annual plan. Computed as:
        <code>(months remaining × monthly price) × 0.9</code>
        — the 10% deduction covers payment processing and operational costs.
      </p>

      <h2>Data after cancellation</h2>
      <ul>
        <li>Your data is preserved for 90 days after cancellation</li>
        <li>You can re-activate your account during this window with no data loss</li>
        <li>After 90 days, all your data is permanently deleted</li>
        <li>Request earlier deletion at any time via the Privacy contact below</li>
      </ul>

      <h2>How to get a refund</h2>
      <p>
        Email <a href="mailto:billing@factoryos.in">billing@factoryos.in</a> with:
      </p>
      <ul>
        <li>Your registered phone number or business name</li>
        <li>The reason (helps us improve)</li>
        <li>Bank/UPI details if not the original payment method</li>
      </ul>
      <p>
        Refunds processed within 7 working days to the original payment method
        (or your specified bank account if the original method is unavailable).
      </p>

      <h2>Disputed charges</h2>
      <p>
        Please contact us before raising a chargeback with your bank. We&apos;ll resolve
        any billing dispute within 3 working days.
      </p>
    </LegalShell>
  );
}
