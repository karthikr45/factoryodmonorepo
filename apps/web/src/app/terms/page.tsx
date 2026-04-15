import { LegalShell, legalMetadata } from '@/components/legal-shell';

export const metadata = legalMetadata(
  'Terms of Service',
  'The terms governing your use of FactoryOS.',
);

export default function TermsPage(): JSX.Element {
  return (
    <LegalShell title="Terms of Service" lastUpdated="April 2026">
      <p>
        These terms govern your use of FactoryOS, operated by MK Tech Monk Pvt Ltd.
        By signing up, you agree to these terms.
      </p>

      <h2>1. The service</h2>
      <p>
        FactoryOS is a SaaS platform for manufacturing operations. We provide:
        order management, production tracking, attendance, inventory, accounting, and
        compliance tools to factories, staffing agencies, and chartered accountants
        in India.
      </p>

      <h2>2. Account responsibilities</h2>
      <ul>
        <li>You are responsible for all activity under your account</li>
        <li>Keep your phone number secure — it&apos;s your authentication credential</li>
        <li>Notify us immediately of unauthorized access</li>
        <li>You must be at least 18 years old to sign up</li>
        <li>You must have authority to bind the business you represent</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree NOT to:</p>
      <ul>
        <li>Use FactoryOS for illegal activities</li>
        <li>Attempt to access other organisations&apos; data</li>
        <li>Reverse engineer or attempt to extract source code</li>
        <li>Resell access without our written permission</li>
        <li>Use the API for scraping or data harvesting</li>
        <li>Send spam through our notification system</li>
      </ul>

      <h2>4. Plans + pricing</h2>
      <ul>
        <li>Pricing is monthly, in INR, billed in advance</li>
        <li>Plans can be upgraded or downgraded at any time</li>
        <li>GST charged as per Indian tax law</li>
        <li>First 50 customers get founder pricing of ₹2,999/month for life on the Growth plan</li>
      </ul>

      <h2>5. Cancellation + refunds</h2>
      <p>See our <a href="/refund">Refund Policy</a> for full details. In summary:</p>
      <ul>
        <li>Cancel anytime — no minimum lock-in</li>
        <li>Pro-rated refund within 14 days of first payment if you&apos;re unhappy</li>
        <li>No refunds for partial months after 14-day window</li>
        <li>Data export available before deletion</li>
      </ul>

      <h2>6. Data ownership</h2>
      <ul>
        <li>You own all your business data</li>
        <li>We provide the tools to manage it</li>
        <li>You can export at any time</li>
        <li>We will not delete data except as per cancellation policy</li>
      </ul>

      <h2>7. Service availability</h2>
      <ul>
        <li>We target 99.9% uptime</li>
        <li>Scheduled maintenance announced 24 hours in advance</li>
        <li>If downtime exceeds 0.1% in a month, account credits available on request</li>
      </ul>

      <h2>8. Limitation of liability</h2>
      <p>
        FactoryOS is provided &ldquo;as is&rdquo;. While we make every effort to ensure accuracy
        of GST calculations, journal entries, and reports, you remain responsible for
        verifying compliance with Indian tax law. Our maximum liability in any case is
        capped at the amount you&apos;ve paid us in the preceding 12 months.
      </p>

      <h2>9. Indemnity</h2>
      <p>
        You agree to indemnify FactoryOS against claims arising from your misuse of the
        service or violation of these terms.
      </p>

      <h2>10. Termination</h2>
      <p>We may terminate your account if:</p>
      <ul>
        <li>You violate these terms</li>
        <li>Your payment fails for 30+ days</li>
        <li>You engage in fraud or harm other users</li>
      </ul>
      <p>You can terminate anytime by cancelling in your settings.</p>

      <h2>11. Governing law</h2>
      <p>
        These terms are governed by the laws of India. Disputes will be resolved in
        the courts of Hyderabad, Telangana.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these terms: <a href="mailto:legal@factoryos.in">legal@factoryos.in</a>
      </p>
    </LegalShell>
  );
}
