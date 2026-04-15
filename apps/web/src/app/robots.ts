import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://factoryos.in';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/factory/', '/agency/', '/ca/', '/admin/', '/worker/', '/api/'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
