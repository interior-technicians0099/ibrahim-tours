import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import PlatformNav from '@/components/platform/PlatformNav';
import PlatformReceiptsClient from '@/components/platform/PlatformReceiptsClient';

export const metadata: Metadata = {
  title: 'Receipts & Tour Uhakiki | Platform Administration',
  description: 'Sequential official receipts and tour-day check-in verification management.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PlatformReceiptsPage() {
  const user = await requireRole([Role.PLATFORM_ADMIN, Role.COMPANY_ADMIN]);

  const receipts = await prisma.receipt.findMany({
    orderBy: { issuedAt: 'desc' },
    include: {
      booking: {
        include: {
          tour: { select: { title: true } },
          transportService: { select: { title: true } },
          route: { select: { origin: true, destination: true } },
          operator: { select: { companyName: true } },
          checkedInBy: { select: { name: true, email: true } },
        },
      },
      issuedBy: {
        select: { name: true, email: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <PlatformNav adminName={user.name || undefined} adminEmail={user.email || undefined} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <PlatformReceiptsClient initialReceipts={receipts as any} />
      </main>
    </div>
  );
}
