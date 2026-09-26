import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  isActive: z.boolean(),
});

/**
 * P1 — Activate / deactivate portal accounts (super admin only).
 * Self-deactivation is blocked.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole([Role.PLATFORM_ADMIN]);
    const { id } = await context.params;

    if (id === admin.id) {
      return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
      select: { id: true, email: true, isActive: true },
    });

    const forwardedFor = request.headers.get('x-forwarded-for');
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: parsed.data.isActive ? 'ADMIN_USER_ACTIVATED' : 'ADMIN_USER_DEACTIVATED',
        entityType: 'AdminUser',
        entityId: id,
        details: { email: updated.email },
        ipAddress: forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1',
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error('Error updating admin user:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update user.' }, { status: 500 });
  }
}
