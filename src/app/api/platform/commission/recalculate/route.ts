import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { recalculateUnsettledCommissions } from '@/lib/commission';

/**
 * POST /api/platform/commission/recalculate
 * Triggers batch recalculation of all unsettled bookings with PENDING_RATE or null commissionRate.
 * Accessible ONLY to PLATFORM_ADMIN.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN]);

    const body = await request.json().catch(() => ({}));
    const operatorId = body.operatorId as string | undefined;
    const customRate = body.rate ? Number(body.rate) : undefined;

    const result = await recalculateUnsettledCommissions({
      operatorId,
      rate: customRate,
    });

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    if (result.success && result.recalculatedCount > 0) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'RECALCULATE_UNSETTLED_COMMISSIONS',
          entityType: 'Booking',
          details: {
            recalculatedCount: result.recalculatedCount,
            operatorId: operatorId || 'ALL',
            rateUsed: customRate,
            bookings: result.bookings.map((b) => b.referenceCode),
          },
          ipAddress: clientIp,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error recalculating commissions:', error);
    const isAuthError =
      error?.message?.includes('Forbidden') || error?.message?.includes('Unauthorized');
    return NextResponse.json(
      { error: error?.message || 'Failed to recalculate unsettled commissions.' },
      { status: isAuthError ? 403 : 500 }
    );
  }
}
