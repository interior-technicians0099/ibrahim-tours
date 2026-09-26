import React from 'react';
import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import PlatformNav from '@/components/platform/PlatformNav';
import CategoryManagerClient from '@/components/operator/CategoryManagerClient';

export const metadata: Metadata = {
  title: 'Categories | Platform Administration',
  description: 'Super-admin tour category management.',
  robots: { index: false, follow: false },
};

export default async function PlatformCategoriesPage() {
  const user = await requireRole([Role.PLATFORM_ADMIN]);

  const categories = await prisma.tourCategory.findMany({
    include: { _count: { select: { tours: true } } },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PlatformNav adminName={user.name || undefined} adminEmail={user.email || undefined} />
      <CategoryManagerClient
        initialCategories={categories}
        userRole={user.role}
        userEmail={user.email}
      />
    </div>
  );
}
