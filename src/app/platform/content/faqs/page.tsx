import React from 'react';
import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import PlatformNav from '@/components/platform/PlatformNav';
import FaqManagerClient from '@/components/operator/FaqManagerClient';

export const metadata: Metadata = {
  title: 'FAQs | Platform Administration',
  description: 'Super-admin FAQ management.',
  robots: { index: false, follow: false },
};

export default async function PlatformFaqsPage() {
  const user = await requireRole([Role.PLATFORM_ADMIN]);

  const faqs = await prisma.faq.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PlatformNav adminName={user.name || undefined} adminEmail={user.email || undefined} />
      <FaqManagerClient
        initialFaqs={faqs}
        userRole={user.role}
        userEmail={user.email}
      />
    </div>
  );
}
