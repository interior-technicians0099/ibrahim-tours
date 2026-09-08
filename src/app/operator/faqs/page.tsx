import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import FaqManagerClient from '@/components/operator/FaqManagerClient';

export default async function OperatorFaqsPage() {
  await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);

  const faqs = await prisma.faq.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return <FaqManagerClient initialFaqs={faqs} />;
}
