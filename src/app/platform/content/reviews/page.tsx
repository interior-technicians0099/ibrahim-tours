import React from 'react';
import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import PlatformNav from '@/components/platform/PlatformNav';
import ReviewManagerClient from '@/components/operator/ReviewManagerClient';

export const metadata: Metadata = {
  title: 'Reviews | Platform Administration',
  description: 'Super-admin review management.',
  robots: { index: false, follow: false },
};

export default async function PlatformReviewsPage() {
  const user = await requireRole([Role.PLATFORM_ADMIN]);

  const [dbReviews, tours] = await Promise.all([
    prisma.review.findMany({
      include: { tour: true, transportService: true },
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PlatformNav adminName={user.name || undefined} adminEmail={user.email || undefined} />
      <ReviewManagerClient
        initialReviews={formattedReviews}
        tours={tours}
        userRole={user.role}
        userEmail={user.email}
      />
    </div>
  );
}
