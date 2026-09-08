'use server';

import { requireRole } from '@/lib/auth';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function saveReviewAction(data: {
  id?: string;
  reviewerName: string;
  reviewerCountry?: string;
  rating: number;
  title?: string;
  body: string;
  tourId?: string;
  transportServiceId?: string;
  source?: string;
  sourceUrl?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  adminResponse?: string;
}) {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);

  let review: any;
  if (data.id) {
    review = await prisma.review.update({
      where: { id: data.id },
      data: {
        reviewerName: data.reviewerName.trim(),
        reviewerCountry: data.reviewerCountry?.trim() || null,
        rating: Number(data.rating) || 5,
        title: data.title?.trim() || null,
        body: data.body.trim(),
        tourId: data.tourId || null,
        transportServiceId: data.transportServiceId || null,
        source: data.source?.trim() || 'Verified Direct Booking',
        sourceUrl: data.sourceUrl?.trim() || null,
        isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
        isFeatured: Boolean(data.isFeatured),
        adminResponse: data.adminResponse?.trim() || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_REVIEW',
        entityType: 'Review',
        entityId: review.id,
        details: { reviewerName: review.reviewerName, rating: review.rating },
      },
    });
  } else {
    review = await prisma.review.create({
      data: {
        reviewerName: data.reviewerName.trim(),
        reviewerCountry: data.reviewerCountry?.trim() || null,
        rating: Number(data.rating) || 5,
        title: data.title?.trim() || null,
        body: data.body.trim(),
        tourId: data.tourId || null,
        transportServiceId: data.transportServiceId || null,
        source: data.source?.trim() || 'Verified Direct Booking',
        sourceUrl: data.sourceUrl?.trim() || null,
        isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
        isFeatured: Boolean(data.isFeatured),
        adminResponse: data.adminResponse?.trim() || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_REVIEW',
        entityType: 'Review',
        entityId: review.id,
        details: { reviewerName: review.reviewerName, rating: review.rating },
      },
    });
  }

  revalidatePath('/reviews');
  revalidatePath('/operator/reviews');
  revalidatePath('/');

  return { success: true, review };
}

export async function toggleReviewPublishedAction(id: string, isPublished: boolean) {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);

  const review = await prisma.review.update({
    where: { id },
    data: { isPublished },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: isPublished ? 'PUBLISH_REVIEW' : 'UNPUBLISH_REVIEW',
      entityType: 'Review',
      entityId: id,
      details: { reviewerName: review.reviewerName, isPublished },
    },
  });

  revalidatePath('/reviews');
  revalidatePath('/operator/reviews');
  revalidatePath('/');

  return { success: true, isPublished: review.isPublished };
}

export async function deleteReviewAction(id: string) {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);

  const review = await prisma.review.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'DELETE_REVIEW',
      entityType: 'Review',
      entityId: id,
      details: { reviewerName: review.reviewerName },
    },
  });

  revalidatePath('/reviews');
  revalidatePath('/operator/reviews');
  revalidatePath('/');

  return { success: true };
}
