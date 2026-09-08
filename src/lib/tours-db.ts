import { prisma } from '@/lib/prisma';
import { ALL_TOURS } from '@/lib/constants';
import { Tour } from '@/lib/types';

export async function getPublicTours(): Promise<Tour[]> {
  try {
    const dbTours = await prisma.tour.findMany({
      where: { isActive: true },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!dbTours || dbTours.length === 0) {
      return ALL_TOURS;
    }

    // Map each active DB tour to public Tour model
    return dbTours.map((dbTour) => {
      const staticTour = ALL_TOURS.find((d) => d.slug === dbTour.slug);

      // Extract valid images (Cloudinary, absolute URLs, or local /images/... paths)
      const validImages = dbTour.images.filter(
        (img) =>
          Boolean(img.url) &&
          (img.url.startsWith('http://') ||
            img.url.startsWith('https://') ||
            img.url.startsWith('/'))
      );

      // Determine hero image
      const hero = validImages.find((img) => img.isHero) || validImages[0];
      const imageUrl = hero?.url || staticTour?.image || undefined;

      if (staticTour) {
        return {
          ...staticTour,
          id: dbTour.id,
          title: dbTour.title || staticTour.title,
          description: dbTour.description || staticTour.description,
          featured: dbTour.isFeatured ?? staticTour.featured,
          image: imageUrl,
          images:
            validImages.length > 0
              ? validImages.map((img) => ({
                  url: img.url,
                  alt: img.alt || staticTour.title,
                  isHero: img.isHero,
                }))
              : staticTour.images ||
                (imageUrl ? [{ url: imageUrl, alt: staticTour.title, isHero: true }] : []),
        };
      }

      // If created in DB without a static counterpart
      const pricingTiers: any = dbTour.pricingTiers || {};
      const singlePrice = pricingTiers.single?.priceCents
        ? Math.round(pricingTiers.single.priceCents / 100)
        : Math.round(dbTour.startingPriceCents / 100);
      const couplePrice = pricingTiers.couple?.priceCents
        ? Math.round(pricingTiers.couple.priceCents / 100)
        : singlePrice;
      const group5Price = pricingTiers.group5to10?.priceCents
        ? Math.round(pricingTiers.group5to10.priceCents / 100)
        : singlePrice;
      const group20Price = pricingTiers.group20?.priceCents
        ? Math.round(pricingTiers.group20.priceCents / 100)
        : undefined;

      const duration: 'Full Day' | 'Half Day' = dbTour.durationText.toLowerCase().includes('half')
        ? 'Half Day'
        : 'Full Day';

      return {
        id: dbTour.id,
        slug: dbTour.slug,
        title: dbTour.title,
        duration,
        category: (dbTour.category?.name as any) || 'Sea & Water',
        tagline: dbTour.shortDescription || dbTour.title,
        description: dbTour.description,
        pricing: {
          single: singlePrice,
          couple: couplePrice,
          group5to10: group5Price,
          group20: group20Price,
        },
        inclusions: (dbTour.inclusions as string[]) || [],
        highlights: (dbTour.highlights as string[]) || [],
        image: imageUrl,
        images: validImages.map((img) => ({
          url: img.url,
          alt: img.alt,
          isHero: img.isHero,
        })),
        featured: dbTour.isFeatured,
      };
    });
  } catch (err) {
    console.error('Error fetching public tours from DB:', err);
    return ALL_TOURS;
  }
}

export async function getPublicTourBySlug(slug: string): Promise<Tour | null> {
  const all = await getPublicTours();
  return all.find((t) => t.slug === slug) || null;
}

