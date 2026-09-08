'use server';

import { requireRole, getScopedOperatorId } from '@/lib/auth';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface TourFormData {
  id?: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description: string;
  categoryId: string;
  durationText: string;
  startingPriceCents: number;
  isFeatured?: boolean;
  isActive?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  pricingTiers: Record<
    string,
    {
      priceCents: number;
      costCents?: number;
      label?: string;
    }
  >;
  highlights: string[];
  inclusions: string[];
  exclusions?: string[];
  images: Array<{
    id?: string;
    url: string;
    publicId?: string;
    alt?: string;
    isHero?: boolean;
    sortOrder?: number;
  }>;
}

export async function saveTourAction(data: TourFormData) {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
  const scopedOperatorId = await getScopedOperatorId();
  const effectiveOperatorId = scopedOperatorId || (await prisma.operatorProfile.findFirst())?.id || 'operator-ibrahim';

  const cleanSlug = data.slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');

  // Verify category exists
  let category: any = await prisma.tourCategory.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) {
    // Fallback to first category
    category = await prisma.tourCategory.findFirst();
    if (!category) {
      category = await prisma.tourCategory.create({
        data: { name: 'Excursions', slug: 'excursions' },
      });
    }
  }

  let savedTour: any;

  if (data.id) {
    // Check permission
    const existing = await prisma.tour.findUnique({
      where: { id: data.id },
    });
    if (!existing) {
      throw new Error('Tour not found.');
    }
    if (user.role === Role.OPERATOR && scopedOperatorId && existing.operatorId !== scopedOperatorId) {
      throw new Error('403 Forbidden: You do not have permission to edit this tour.');
    }

    // Update tour
    savedTour = await prisma.tour.update({
      where: { id: data.id },
      data: {
        slug: cleanSlug,
        title: data.title.trim(),
        shortDescription: data.shortDescription?.trim() || null,
        description: data.description.trim(),
        categoryId: category.id,
        durationText: data.durationText.trim(),
        startingPriceCents: data.startingPriceCents,
        isFeatured: Boolean(data.isFeatured),
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        seoTitle: data.seoTitle?.trim() || null,
        seoDescription: data.seoDescription?.trim() || null,
        pricingTiers: data.pricingTiers as any,
        highlights: data.highlights,
        inclusions: data.inclusions,
        exclusions: data.exclusions || [],
      },
    });

    // Sync TourImage records
    await prisma.tourImage.deleteMany({ where: { tourId: savedTour.id } });
    if (data.images && data.images.length > 0) {
      await prisma.tourImage.createMany({
        data: data.images.map((img, idx) => ({
          tourId: savedTour.id,
          publicId: img.publicId || null,
          url: img.url,
          alt: img.alt || savedTour.title,
          sortOrder: img.sortOrder !== undefined ? img.sortOrder : idx,
          isHero: Boolean(img.isHero),
        })),
      });
    }

    // Write AuditLog
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_TOUR',
        entityType: 'Tour',
        entityId: savedTour.id,
        details: {
          title: savedTour.title,
          slug: savedTour.slug,
          startingPriceCents: savedTour.startingPriceCents,
        },
      },
    });
  } else {
    // Create new tour
    savedTour = await prisma.tour.create({
      data: {
        slug: cleanSlug,
        title: data.title.trim(),
        shortDescription: data.shortDescription?.trim() || null,
        description: data.description.trim(),
        categoryId: category.id,
        operatorId: effectiveOperatorId,
        durationText: data.durationText.trim(),
        startingPriceCents: data.startingPriceCents,
        isFeatured: Boolean(data.isFeatured),
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        seoTitle: data.seoTitle?.trim() || null,
        seoDescription: data.seoDescription?.trim() || null,
        pricingTiers: data.pricingTiers as any,
        highlights: data.highlights,
        inclusions: data.inclusions,
        exclusions: data.exclusions || [],
        images: {
          create: (data.images || []).map((img, idx) => ({
            publicId: img.publicId || null,
            url: img.url,
            alt: img.alt || data.title,
            sortOrder: img.sortOrder !== undefined ? img.sortOrder : idx,
            isHero: Boolean(img.isHero),
          })),
        },
      },
    });

    // Write AuditLog
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_TOUR',
        entityType: 'Tour',
        entityId: savedTour.id,
        details: {
          title: savedTour.title,
          slug: savedTour.slug,
          startingPriceCents: savedTour.startingPriceCents,
        },
      },
    });
  }

  // ISR Cache Revalidation
  revalidatePath('/tours');
  revalidatePath(`/tours/${savedTour.slug}`);
  revalidatePath('/');
  revalidatePath('/operator/tours');

  return { success: true, tour: savedTour };
}

export async function toggleTourActiveAction(tourId: string, isActive: boolean) {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
  const scopedOperatorId = await getScopedOperatorId();

  const tour = await prisma.tour.findUnique({ where: { id: tourId } });
  if (!tour) throw new Error('Tour not found.');
  if (user.role === Role.OPERATOR && scopedOperatorId && tour.operatorId !== scopedOperatorId) {
    throw new Error('403 Forbidden: You do not have permission to modify this tour.');
  }

  const updated = await prisma.tour.update({
    where: { id: tourId },
    data: { isActive },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: isActive ? 'ACTIVATE_TOUR' : 'DEACTIVATE_TOUR',
      entityType: 'Tour',
      entityId: tourId,
      details: { title: tour.title, isActive },
    },
  });

  revalidatePath('/tours');
  revalidatePath(`/tours/${tour.slug}`);
  revalidatePath('/');
  revalidatePath('/operator/tours');

  return { success: true, isActive: updated.isActive };
}

export async function deleteTourAction(tourId: string) {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
  const scopedOperatorId = await getScopedOperatorId();

  const tour = await prisma.tour.findUnique({ where: { id: tourId } });
  if (!tour) throw new Error('Tour not found.');
  if (user.role === Role.OPERATOR && scopedOperatorId && tour.operatorId !== scopedOperatorId) {
    throw new Error('403 Forbidden: You do not have permission to delete this tour.');
  }

  await prisma.tour.delete({ where: { id: tourId } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'DELETE_TOUR',
      entityType: 'Tour',
      entityId: tourId,
      details: { title: tour.title, slug: tour.slug },
    },
  });

  revalidatePath('/tours');
  revalidatePath('/');
  revalidatePath('/operator/tours');

  return { success: true };
}
