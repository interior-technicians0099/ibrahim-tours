import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getScopedOperatorId } from '@/lib/auth-helpers';
import { Role, SettlementStatus } from '@prisma/client';
import {
  runMonthlySettlementForOperator,
  runAllMonthlySettlements,
} from '@/lib/services/settlement-service';

/**
 * GET /api/platform/settlements
 * Lists monthly settlements.
 * Scoped to operatorId for OPERATOR, global for PLATFORM_ADMIN.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN, Role.OPERATOR]);
    const scopedOperatorId = await getScopedOperatorId();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const status = searchParams.get('status') as SettlementStatus | null;
    const operatorId = searchParams.get('operatorId');

    const effectiveOperatorId =
      user.role === Role.OPERATOR ? scopedOperatorId : operatorId || undefined;

    const settlements = await prisma.monthlySettlement.findMany({
      where: {
        ...(effectiveOperatorId ? { operatorId: effectiveOperatorId } : {}),
        ...(month ? { month } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        operator: true,
      },
      orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
    });

    const formatted = settlements.map((s: any) => ({
      id: s.id,
      operatorId: s.operatorId,
      operatorName: s.operator?.name || s.operator?.businessName || 'Operator',
      month: s.month,
      totalBookings: s.totalBookings,
      totalRevenueCents: Number(s.totalRevenueCents),
      totalProfitCents: Number(s.totalProfitCents),
      commissionRate: Number(s.commissionRate) * 100,
      commissionDueCents: Number(s.commissionDueCents),
      status: s.status,
      settledAt: s.settledAt ? s.settledAt.toISOString() : null,
      notes: s.notes,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      settlements: formatted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch settlements.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/platform/settlements
 * Generates monthly settlement rollup for a month and operator.
 * Can be triggered by PLATFORM_ADMIN session or Vercel Cron (Bearer CRON_SECRET).
 */
export async function POST(request: NextRequest) {
  try {
    // Check Authorization header for Cron Secret or require PLATFORM_ADMIN session
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized =
      cronSecret && authHeader && authHeader === `Bearer ${cronSecret}`;

    let adminUserId = 'system-cron';

    if (!isCronAuthorized) {
      const user = await requireRole([Role.PLATFORM_ADMIN]);
      adminUserId = user.id;
    }

    const body = await request.json().catch(() => ({}));
    const targetMonth =
      body.month ||
      new Date().toISOString().slice(0, 7); // Default to current month "YYYY-MM"
    const targetOperatorId = body.operatorId;

    let results;
    if (targetOperatorId) {
      const summary = await runMonthlySettlementForOperator(
        targetOperatorId,
        targetMonth,
        adminUserId
      );
      results = [summary];
    } else {
      results = await runAllMonthlySettlements(targetMonth, adminUserId);
    }

    return NextResponse.json({
      success: true,
      month: targetMonth,
      count: results.length,
      settlements: results,
      message: `Successfully calculated monthly settlements for ${targetMonth}.`,
    });
  } catch (error: any) {
    console.error('Error generating monthly settlements:', error);
    const isAuthError =
      error?.message?.includes('Forbidden') || error?.message?.includes('Unauthorized');
    return NextResponse.json(
      { error: error?.message || 'Failed to generate monthly settlements.' },
      { status: isAuthError ? 403 : 500 }
    );
  }
}
