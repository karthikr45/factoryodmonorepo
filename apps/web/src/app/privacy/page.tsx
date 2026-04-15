import { LegalShell, legalMetadata } from '@/components/legal-shell';

export const metadata = legalMetadata(
  'Privacy Policy',
  'How FactoryOS collects, uses, and protects your business data.',
);

export default function PrivacyPage(): JSX.Element {
  return (
    <LegalShell title="Privacy Policy" lastUpdated="April 2026">
      <p>
        FactoryOS is built and operated by MK Tech Monk Pvt Ltd, an Indian company. We take your
        data privacy seriously. This policy explains what we collect, why, and what control you
        have over it.
      </p>

      <h2>1. What we collect</h2>
      <h3>Account information</h3>
      <ul>
        <li>Phone number (for OTP login — we never store passwords)</li>
        <li>Name, email (optional), business name, GSTIN (optional)</li>
        <li>Role within your organisation</li>
      </ul>
      <h3>Business data you create</h3>
      <ul>
        <li>Customer, vendor, and worker records you add</li>
        <li>Orders, invoices, attendance, and journal entries</li>
        <li>Files you upload (PO invoices, QC certificates, worker documents)</li>
      </ul>
      <h3>Usage data</h3>
      <ul>
        <li>Pages you visit, features you use (anonymous analytics)</li>
        <li>Crash reports if the app errors out</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To run the FactoryOS service for you</li>
        <li>To send you OTPs via SMS for authentication</li>
        <li>To send you operational alerts (attendance approvals, low stock, etc.)</li>
        <li>To improve the product (anonymous aggregated analytics)</li>
      </ul>

      <h2>3. Multi-tenancy + data isolation</h2>
      <p>
        Every record in FactoryOS is tagged with your organisation ID. No other organisation
        can ever see your data. We enforce this at three levels:
      </p>
      <ol>
        <li>API guards check organisation ID on every request</li>
        <li>Service methods scope queries to your org by default</li>
        <li>Database row-level security as a final safety net</li>
      </ol>

      <h2>4. Sharing</h2>
      <p>We share your data only with parties you explicitly connect to:</p>
      <ul>
        <li>Your CA firm (when you invite them — they see your books)</li>
        <li>Your staffing agency (they see attendance you approve)</li>
        <li>Your team members (with role-based permissions you control)</li>
      </ul>
      <p>We do <strong>not</strong> sell your data, share with advertisers, or use it to train AI models.</p>

      <h2>5. Third-party services we use</h2>
      <ul>
        <li><strong>Supabase</strong> — Postgres database hosting (Singapore region)</li>
        <li><strong>Twilio</strong> — SMS for OTP delivery</li>
        <li><strong>Anthropic Claude</strong> — AI assistant features (your queries + a small data snapshot are sent)</li>
        <li><strong>Vercel</strong> — Web hosting</li>
        <li><strong>Sentry</strong> — Error monitoring (no business data, just stack traces)</li>
      </ul>

      <h2>6. Data retention</h2>
      <ul>
        <li>Active accounts: data retained as long as account is active</li>
        <li>Cancelled accounts: 90 days then permanently deleted (you can request earlier)</li>
        <li>OTPs: 10 minutes, then deleted</li>
        <li>AI conversation logs: 90 days for audit, then deleted</li>
      </ul>

      <h2>7. Your rights</h2>
      <p>Under Indian DPDP Act 2023, you have the right to:</p>
      <ul>
        <li>Access all data we hold about you (export available in app)</li>
        <li>Correct inaccurate data (edit in app, or contact us)</li>
        <li>Delete your account and data (90-day grace period)</li>
        <li>Withdraw consent (cancel subscription)</li>
      </ul>

      <h2>8. Security</h2>
      <ul>
        <li>HTTPS everywhere — no plaintext in transit</li>
        <li>Encrypted at rest (AES-256)</li>
        <li>JWT-based authentication, 15-minute access tokens</li>
        <li>Daily database backups</li>
        <li>SOC 2 in progress</li>
      </ul>

      <h2>9. Contact us</h2>
      <p>
        Data Protection Officer: <a href="mailto:dpo@factoryos.in">dpo@factoryos.in</a>
        <br />
        General queries: <a href="/contact">Contact form</a>
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We&apos;ll email you 30 days before any material change. Continued use of FactoryOS
        after the change means you accept the updated policy.
      </p>
    </LegalShell>
  );
}
