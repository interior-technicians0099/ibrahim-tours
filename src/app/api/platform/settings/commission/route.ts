import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { Role, CommissionStatus } from '@prisma/client';
import { getGlobalCommissionRate } from '@/lib/commission';

/**
 * GET /api/platform/settings/commission
 * Retrieves the current platform commission rate.
 * Accessible to PLATFORM_ADMIN and OPERATOR.
 */
export async function GET() {
  try {
    await requireRole([Role.PLATFORM_ADMIN, Role.OPERATOR]);
    const rate = await getGlobalCommissionRate();

    const setting = await prisma.settings.findUnique({
      where: { key: 'commission_rate' },
      select: { updatedAt: true, description: true },
    });

    // Count unsettled bookings needing rate
    const pendingRateCount = await prisma.booking.count({
      where: {
        status: 'COMPLETED',
        paymentStatus: 'PAID_IN_FULL',
        OR: [
          { commissionStatus: CommissionStatus.PENDING_RATE },
          { commissionRate: null },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      commissionRate: rate,
      status: rate !== null ? 'CONFIGURED' : 'PENDING_RATE',
      effectiveDate: setting?.updatedAt ? setting.updatedAt.toISOString() : null,
      pendingRateBookingsCount: pendingRateCount,
      message:
        rate !== null
          ? `Platform commission rate is currently configured at ${rate}%.`
          : 'Platform commission rate is currently pending decision (TBD).',
    });
  } catch (error: any) {
    const isAuthError =
      error?.message?.includes('Forbidden') || error?.message?.includes('Unauthorized');
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch commission setting.' },
      { status: isAuthError ? 403 : 500 }
    );
  }
}

/**
 * PATCH /api/platform/settings/commission
 * Updates the global platform commission rate (e.g. 15.00%).
 * Accessible ONLY to PLATFORM_ADMIN.
 * Every change creates an AuditLog with old -> new value + effective date.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN]);

    const body = await request.json();
    const rawRate = body.rate;

    let normalizedRate: number | null = null;

    if (rawRate !== null && rawRate !== undefined && rawRate !== '') {
      const num = Number(rawRate);
      if (isNaN(num) || num < 0 || num > 100) {
        return NextResponse.json(
          { error: 'Invalid commission rate. Must be a percentage between 0 and 100, or null.' },
          { status: 400 }
        );
      }
      normalizedRate = Number(num.toFixed(2));
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // 1. Fetch current rate BEFORE updating to capture previousRate
    const previousRate = await getGlobalCommissionRate();
    const effectiveDate = body.effectiveDate || new Date().toISOString();

    // 2. Upsert into Settings
    const setting = await prisma.settings.upsert({
      where: { key: 'commission_rate' },
      update: {
        value: { rate: normalizedRate },
        description:
          body.description || 'Standard platform commission percentage on tour/transport profits.',
      },
      create: {
        key: 'commission_rate',
        value: { rate: normalizedRate },
        description:
          body.description || 'Standard platform commission percentage on tour/transport profits.',
      },
    });

    // 3. Write to AuditLog with old -> new value + effective date
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_COMMISSION_SETTING',
        entityType: 'Settings',
        entityId: 'commission_rate',
        details: {
          previousRate,
          newRate: normalizedRate,
          effectiveDate,
          description: setting.description,
        },
        ipAddress: clientIp,
      },
    });

    // Count unsettled bookings that can now be recalculated
    const pendingRateCount = await prisma.booking.count({
      where: {
        status: 'COMPLETED',
        paymentStatus: 'PAID_IN_FULL',
        costCents: { not: null },
        OR: [
          { commissionStatus: CommissionStatus.PENDING_RATE },
          { commissionRate: null },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      commissionRate: normalizedRate,
      status: normalizedRate !== null ? 'CONFIGURED' : 'PENDING_RATE',
      effectiveDate,
      pendingRateBookingsCount: pendingRateCount,
      message:
        normalizedRate !== null
          ? `Platform commission rate successfully updated to ${normalizedRate}%. ${pendingRateCount} unsettled booking(s) can now be recalculated.`
          : 'Platform commission rate set to TBD (pending rate).',
    });
  } catch (error: any) {
    console.error('Error updating commission setting:', error);
    const isAuthError =
      error?.message?.includes('Forbidden') || error?.message?.includes('Unauthorized');
    return NextResponse.json(
      { error: error?.message || 'Failed to update commission setting.' },
      { status: isAuthError ? 403 : 500 }
    );
  }
}
