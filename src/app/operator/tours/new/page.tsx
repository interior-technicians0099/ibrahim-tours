import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import TourEditorClient from '@/components/operator/TourEditorClient';

export default async function NewTourPage() {
  await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);

  const categories = await prisma.tourCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <TourEditorClient
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
