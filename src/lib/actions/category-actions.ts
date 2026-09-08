'use server';

import { requireRole } from '@/lib/auth';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function saveCategoryAction(data: {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);

  const cleanSlug = data.slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');

  let category;
  if (data.id) {
    category = await prisma.tourCategory.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        slug: cleanSlug,
        description: data.description?.trim() || null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_CATEGORY',
        entityType: 'TourCategory',
        entityId: category.id,
        details: { name: category.name, slug: category.slug },
      },
    });
  } else {
    category = await prisma.tourCategory.create({
      data: {
        name: data.name.trim(),
        slug: cleanSlug,
        description: data.description?.trim() || null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_CATEGORY',
        entityType: 'TourCategory',
        entityId: category.id,
        details: { name: category.name, slug: category.slug },
      },
    });
  }

  revalidatePath('/tours');
  revalidatePath('/operator/categories');
  revalidatePath('/operator/tours');

  return { success: true, category };
}

export async function deleteCategoryAction(id: string) {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);

  // Check if category has tours
  const count = await prisma.tour.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new Error(`Cannot delete category with ${count} assigned tours. Reassign tours first.`);
  }

  const category = await prisma.tourCategory.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'DELETE_CATEGORY',
      entityType: 'TourCategory',
      entityId: id,
      details: { name: category.name, slug: category.slug },
    },
  });

  revalidatePath('/tours');
  revalidatePath('/operator/categories');
  revalidatePath('/operator/tours');

  return { success: true };
}
