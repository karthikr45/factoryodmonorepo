import { LegalShell, legalMetadata } from '@/components/legal-shell';

export const metadata = legalMetadata(
  'About FactoryOS',
  'The team and mission behind FactoryOS — manufacturing operations for Indian SMBs.',
);

export default function AboutPage(): JSX.Element {
  return (
    <LegalShell title="About FactoryOS" lastUpdated="April 2026">
      <p className="text-lg">
        FactoryOS exists to give every small and medium manufacturer in India the
        operational backbone of a Fortune 500 company — without the Fortune 500 budget.
      </p>

      <h2>The problem we&apos;re solving</h2>
      <p>
        India has over 600,000 registered manufacturing SMBs. They run on a chaotic
        mix of WhatsApp, paper diaries, Excel sheets, and 30-day-stale Tally files.
        The result: orders get lost, attendance is disputed every month, books are
        always behind, GST penalties are routine, and owners are the only people
        who know what&apos;s happening — making them irreplaceable bottlenecks.
      </p>

      <h2>Our approach</h2>
      <p>
        We built one platform that connects three roles: factory owners, staffing
        agencies, and chartered accountants. Every business event — a dispatch, an
        attendance approval, a purchase received — automatically creates an accounting
        entry. Books write themselves. Books are live. Disputes vanish.
      </p>

      <h2>Built in India, for India</h2>
      <ul>
        <li>All amounts in INR. GST built into every transaction.</li>
        <li>EPF + ESIC calculations native, not bolted on</li>
        <li>Phone + OTP login (no passwords — works for low digital literacy)</li>
        <li>Mobile-first design (Hyderabad manufacturers use Android phones)</li>
        <li>WhatsApp-native notifications (where business actually happens)</li>
        <li>Engineering team based in India</li>
      </ul>

      <h2>Built by MK Tech Monk</h2>
      <p>
        FactoryOS is built and operated by{' '}
        <a href="https://mktechmonk.com" target="_blank" rel="noopener noreferrer">
          MK Tech Monk Pvt Ltd
        </a>, a Hyderabad-based product engineering company building software for
        Indian businesses.
      </p>

      <h2>Get in touch</h2>
      <ul>
        <li>Sales: <a href="mailto:sales@factoryos.in">sales@factoryos.in</a></li>
        <li>Support: <a href="mailto:support@factoryos.in">support@factoryos.in</a></li>
        <li>Partnerships: <a href="mailto:partners@factoryos.in">partners@factoryos.in</a></li>
        <li>Press: <a href="mailto:press@factoryos.in">press@factoryos.in</a></li>
        <li>General: <a href="/contact">Contact form</a></li>
      </ul>
    </LegalShell>
  );
}
