import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import PlatformNav from '@/components/platform/PlatformNav';
import PlatformNotificationsClient from '@/components/platform/PlatformNotificationsClient';

export const metadata: Metadata = {
  title: 'Notifications & Email Delivery | Platform Administration',
  description: 'Email delivery log with SENT/FAILED status, diagnostics, and retry.',
  robots: { index: false, follow: false },
};

export default async function PlatformNotificationsPage() {
  const user = await requireRole([Role.PLATFORM_ADMIN]);

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      booking: {
        select: {
          id: true,
          referenceCode: true,
          customerName: true,
          customerEmail: true,
        },
      },
    },
  });

  const failedCount = await prisma.notification.count({ where: { status: 'FAILED' } });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PlatformNav adminName={user.name || undefined} adminEmail={user.email || undefined} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <PlatformNotificationsClient
          initialNotifications={JSON.parse(JSON.stringify(notifications))}
          initialFailedCount={failedCount}
        />
      </main>
    </div>
  );
}
