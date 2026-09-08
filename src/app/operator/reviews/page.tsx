import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import ReviewManagerClient from '@/components/operator/ReviewManagerClient';

export default async function OperatorReviewsPage() {
  await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);

  const [dbReviews, tours] = await Promise.all([
    prisma.review.findMany({
      include: {
        tour: true,
        transportService: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tour.findMany({
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ]);

  const formattedReviews = dbReviews.map((r) => ({
    id: r.id,
    reviewerName: r.reviewerName,
    reviewerCountry: r.reviewerCountry,
    rating: r.rating || 5,
    title: r.title,
    body: r.body,
    source: r.source,
    sourceUrl: r.sourceUrl,
    serviceTitle: r.tour?.title || r.transportService?.title || 'Zanzibar Island Tour',
    tourId: r.tourId,
    isPublished: r.isPublished,
    isFeatured: r.isFeatured,
    adminResponse: r.adminResponse,
    createdAt: new Date(r.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }),
  }));

  return <ReviewManagerClient initialReviews={formattedReviews} tours={tours} />;
}
