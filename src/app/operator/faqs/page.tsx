import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import FaqManagerClient from '@/components/operator/FaqManagerClient';

export default async function OperatorFaqsPage() {
  const user = await requireRole([Role.OPERATOR, Role.COMPANY_ADMIN, Role.PLATFORM_ADMIN]);

  const faqs = await prisma.faq.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <FaqManagerClient
      initialFaqs={faqs}
      userRole={user.role}
      userEmail={user.email}
    />
  );
}
