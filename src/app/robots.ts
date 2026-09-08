import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://ibrahimtours.co.tz';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/book/confirmation/',
          '/operator/',
          '/platform/',
          '/admin/',
          '/change-password',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
