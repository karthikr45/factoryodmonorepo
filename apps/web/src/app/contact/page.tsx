import { LegalShell, legalMetadata } from '@/components/legal-shell';

import { ContactForm } from './contact-form';

export const metadata = legalMetadata(
  'Contact',
  'Get in touch with the FactoryOS team — sales, support, or partnerships.',
);

export default function ContactPage(): JSX.Element {
  return (
    <LegalShell title="Contact us" lastUpdated="">
      <p>We typically respond within 24 hours on business days.</p>

      <div className="not-prose mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Direct contacts */}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h3 className="text-lg font-semibold text-brand-900">Direct email</h3>
          <ul className="mt-4 space-y-3 text-sm text-neutral-700">
            <li>
              <div className="font-semibold text-brand-700">Sales</div>
              <a href="mailto:sales@factoryos.in" className="hover:underline">sales@factoryos.in</a>
            </li>
            <li>
              <div className="font-semibold text-brand-700">Support</div>
              <a href="mailto:support@factoryos.in" className="hover:underline">support@factoryos.in</a>
            </li>
            <li>
              <div className="font-semibold text-brand-700">Partnerships (CAs, agencies)</div>
              <a href="mailto:partners@factoryos.in" className="hover:underline">partners@factoryos.in</a>
            </li>
            <li>
              <div className="font-semibold text-brand-700">Press / media</div>
              <a href="mailto:press@factoryos.in" className="hover:underline">press@factoryos.in</a>
            </li>
            <li>
              <div className="font-semibold text-brand-700">Privacy / data requests</div>
              <a href="mailto:dpo@factoryos.in" className="hover:underline">dpo@factoryos.in</a>
            </li>
          </ul>
          <div className="mt-6 border-t border-neutral-200 pt-4 text-sm text-neutral-700">
            <div className="font-semibold text-brand-900">Office</div>
            <p className="mt-1">
              MK Tech Monk Pvt Ltd<br />
              Hyderabad, Telangana, India
            </p>
          </div>
        </div>

        {/* Form */}
        <ContactForm />
      </div>
    </LegalShell>
  );
}
