'use server';

import { requireRole } from '@/lib/auth';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function saveFaqAction(data: {
  id?: string;
  question: string;
  answer: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);

  let faq;
  if (data.id) {
    faq = await prisma.faq.update({
      where: { id: data.id },
      data: {
        question: data.question.trim(),
        answer: data.answer.trim(),
        category: data.category?.trim() || 'General',
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_FAQ',
        entityType: 'Faq',
        entityId: faq.id,
        details: { question: faq.question },
      },
    });
  } else {
    faq = await prisma.faq.create({
      data: {
        question: data.question.trim(),
        answer: data.answer.trim(),
        category: data.category?.trim() || 'General',
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_FAQ',
        entityType: 'Faq',
        entityId: faq.id,
        details: { question: faq.question },
      },
    });
  }

  revalidatePath('/faq');
  revalidatePath('/operator/faqs');
  revalidatePath('/');

  return { success: true, faq };
}

export async function deleteFaqAction(id: string) {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);

  const faq = await prisma.faq.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'DELETE_FAQ',
      entityType: 'Faq',
      entityId: id,
      details: { question: faq.question },
    },
  });

  revalidatePath('/faq');
  revalidatePath('/operator/faqs');
  revalidatePath('/');

  return { success: true };
}
