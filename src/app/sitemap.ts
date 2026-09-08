import { MetadataRoute } from 'next';
import { ALL_TOURS, TRANSFER_ROUTES } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://ibrahimtours.co.tz';
  const currentDate = new Date();

  // Core public static pages
  const staticPages = [
    '',
    '/tours',
    '/transportation',
    '/about',
    '/reviews',
    '/faq',
    '/contact',
    '/book',
    '/privacy',
    '/terms',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1.0 : 0.8,
  }));

  // Dynamic Tour pages (all 14 tours)
  const tourPages = ALL_TOURS.map((tour) => ({
    url: `${baseUrl}/tours/${tour.slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: tour.featured ? 0.9 : 0.7,
  }));

  // Dynamic Transfer Route pages (all 12 routes)
  const transferPages = TRANSFER_ROUTES.map((route) => ({
    url: `${baseUrl}/transportation/${route.id}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...tourPages, ...transferPages];
}
