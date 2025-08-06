import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://astewai-bookstore.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/books',
          '/books/*',
          '/bundles',
          '/bundles/*',
          '/blog',
          '/blog/*',
          '/contact',
          '/auth/login',
          '/auth/register',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/api/*',
          '/library',
          '/library/*',
          '/profile',
          '/profile/*',
          '/promote-admin',
          '/offline',
          '/_next/*',
          '/.*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/books',
          '/books/*',
          '/bundles',
          '/bundles/*',
          '/blog',
          '/blog/*',
          '/contact',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/api/*',
          '/library',
          '/library/*',
          '/profile',
          '/profile/*',
          '/promote-admin',
          '/offline',
          '/auth/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}