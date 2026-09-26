import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * P0 — Super-admin notification delivery log.
 * GET /api/platform/notifications?status=FAILED&limit=100
 * Surfaces SENT/FAILED rows so failed sends are visible and retryable.
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.PLATFORM_ADMIN]);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Forbidden: PLATFORM_ADMIN only.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get('status') || 'ALL').toUpperCase();
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10) || 100, 1), 500);

  try {
    const notifications = await prisma.notification.findMany({
      where: status === 'ALL' ? undefined : { status },
      orderBy: { createdAt: 'desc' },
      take: limit,
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

    return NextResponse.json({ success: true, notifications, failedCount });
  } catch (err: any) {
    console.error('[api/platform/notifications] List failed:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to load notifications.' },
      { status: 500 }
    );
  }
}
