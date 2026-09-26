import React from 'react';
import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import PlatformNav from '@/components/platform/PlatformNav';
import TourEditorClient from '@/components/operator/TourEditorClient';

export const metadata: Metadata = {
  title: 'New Tour | Platform Administration',
  description: 'Create a new excursion tour.',
  robots: { index: false, follow: false },
};

export default async function PlatformNewTourPage() {
  const user = await requireRole([Role.PLATFORM_ADMIN]);

  const categories = await prisma.tourCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PlatformNav adminName={user.name || undefined} adminEmail={user.email || undefined} />
      <TourEditorClient
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
