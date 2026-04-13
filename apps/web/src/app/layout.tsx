import type { Metadata } from 'next';

import { Providers } from '@/components/providers';

import './globals.css';

export const metadata: Metadata = {
  title: 'FactoryOS — Manufacturing operations for Indian SMBs',
  description:
    'One platform connecting factory owners, staffing agencies, and chartered accountants. Every business event auto-posts to your books. Powered by MK Tech Monk.',
  authors: [{ name: 'MK Tech Monk', url: 'https://mktechmonk.com' }],
  creator: 'MK Tech Monk',
  publisher: 'MK Tech Monk',
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
