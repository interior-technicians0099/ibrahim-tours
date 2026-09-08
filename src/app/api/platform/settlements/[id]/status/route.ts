import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { Role, SettlementStatus } from '@prisma/client';
import { updateSettlementStatus } from '@/lib/services/settlement-service';

/**
 * PATCH /api/platform/settlements/[id]/status
 * Updates monthly settlement status (PENDING -> SETTLED -> PAID).
 * Accessible ONLY to PLATFORM_ADMIN.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN]);
    const { id: settlementId } = await context.params;

    const body = await request.json();
    const targetStatus = body.status as SettlementStatus;
    const notes = body.notes ? String(body.notes).trim() : undefined;

    if (!targetStatus || !Object.values(SettlementStatus).includes(targetStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${Object.values(SettlementStatus).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const updated = await updateSettlementStatus(
      settlementId,
      targetStatus,
      user.id,
      notes
    );

    return NextResponse.json({
      success: true,
      settlement: {
        id: updated.id,
        operatorId: updated.operatorId,
        month: updated.month,
        status: updated.status,
        settledAt: updated.settledAt ? updated.settledAt.toISOString() : null,
        notes: updated.notes,
      },
      message: `Settlement status updated to ${targetStatus}.`,
    });
  } catch (error: any) {
    console.error('Error updating settlement status:', error);
    const isAuthError =
      error?.message?.includes('Forbidden') || error?.message?.includes('Unauthorized');
    return NextResponse.json(
      { error: error?.message || 'Failed to update settlement status.' },
      { status: isAuthError ? 403 : 400 }
    );
  }
}
