import React from 'react';
import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import PlatformNav from '@/components/platform/PlatformNav';
import PlatformUsersClient from '@/components/platform/PlatformUsersClient';

export const metadata: Metadata = {
  title: 'Portal Users | Platform Administration',
  description: 'Super-admin provisioning for the two portal roles.',
  robots: { index: false, follow: false },
};

export default async function PlatformUsersPage() {
  const user = await requireRole([Role.PLATFORM_ADMIN]);

  const [users, operators] = await Promise.all([
    prisma.adminUser.findMany({
      include: { operator: { select: { companyName: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.companyProfile.findMany({
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PlatformNav adminName={user.name || undefined} adminEmail={user.email || undefined} />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <PlatformUsersClient
          currentUserId={user.id}
          initialUsers={JSON.parse(JSON.stringify(users))}
          operators={operators}
        />
      </main>
    </div>
  );
}
