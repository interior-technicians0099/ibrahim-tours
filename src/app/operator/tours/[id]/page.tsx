import React from 'react';
import { notFound } from 'next/navigation';
import { requireRole, getScopedOperatorId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import TourEditorClient from '@/components/operator/TourEditorClient';

export default async function EditTourPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
  const scopedOperatorId = await getScopedOperatorId();

  const tour = await prisma.tour.findUnique({
    where: { id: params.id },
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
      },
      category: true,
    },
  });

  if (!tour) {
    notFound();
  }

  // Operator permission check
  if (user.role === Role.OPERATOR && scopedOperatorId && tour.operatorId !== scopedOperatorId) {
    throw new Error('403 Forbidden: You do not have permission to view or edit this tour.');
  }

  const categories = await prisma.tourCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  const formattedTour = {
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    shortDescription: tour.shortDescription,
    description: tour.description,
    categoryId: tour.categoryId,
    durationText: tour.durationText,
    startingPriceCents: tour.startingPriceCents,
    isFeatured: tour.isFeatured,
    isActive: tour.isActive,
    seoTitle: tour.seoTitle,
    seoDescription: tour.seoDescription,
    pricingTiers: (tour.pricingTiers as any) || {},
    highlights: Array.isArray(tour.highlights) ? (tour.highlights as string[]) : [],
    inclusions: Array.isArray(tour.inclusions) ? (tour.inclusions as string[]) : [],
    exclusions: Array.isArray(tour.exclusions) ? (tour.exclusions as string[]) : [],
    images: tour.images.map((img) => ({
      id: img.id,
      url: img.url,
      publicId: img.publicId || undefined,
      alt: img.alt || tour.title,
      isHero: img.isHero,
      sortOrder: img.sortOrder,
    })),
  };

  return (
    <TourEditorClient
      initialTour={formattedTour}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
