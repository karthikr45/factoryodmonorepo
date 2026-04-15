import type { Metadata, Viewport } from 'next';

import { Providers } from '@/components/providers';

import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://factoryos.in';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'FactoryOS — One platform. Factory, Agency, CA — connected.',
    template: '%s · FactoryOS',
  },
  description:
    'Manufacturing operations + finance for Indian SMBs. Every business event auto-posts to your books. Built for Hyderabad manufacturers.',
  keywords: [
    'factory ERP', 'factory ERP India', 'manufacturing software India',
    'GST compliant ERP', 'attendance management India', 'job card software',
    'small factory software', 'Hyderabad manufacturing', 'staffing agency software',
    'CA software India', 'auto-accounting', 'WhatsApp factory',
  ],
  authors: [{ name: 'MK Tech Monk', url: 'https://mktechmonk.com' }],
  creator: 'MK Tech Monk',
  publisher: 'MK Tech Monk',
  applicationName: 'FactoryOS',
  category: 'Business Software',

  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'FactoryOS',
    title: 'FactoryOS — Run your factory. Your books write themselves.',
    description:
      'Connecting factory owners, staffing agencies, and CAs on one platform. Every operation creates an accounting entry automatically.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FactoryOS — Manufacturing operations for Indian SMBs',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'FactoryOS — Manufacturing operations for Indian SMBs',
    description: 'One platform. Factory, Agency, CA — connected.',
    images: ['/og-image.png'],
    creator: '@factoryos',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },

  alternates: { canonical: SITE_URL },

  other: {
    'theme-color': '#562F54',
  },
};

export const viewport: Viewport = {
  themeColor: '#562F54',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
