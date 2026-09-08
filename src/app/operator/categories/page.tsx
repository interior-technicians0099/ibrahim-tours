import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import CategoryManagerClient from '@/components/operator/CategoryManagerClient';

export default async function OperatorCategoriesPage() {
  await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);

  const categories = await prisma.tourCategory.findMany({
    include: {
      _count: {
        select: { tours: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return <CategoryManagerClient initialCategories={categories} />;
}
