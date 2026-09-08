import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { Role, CommissionStatus, Prisma } from '@prisma/client';
import { resolveEffectiveCommissionRate, calculateCommission } from '@/lib/commission';

/**
 * PATCH /api/platform/bookings/[id]/cost
 * Updates operator cost (costCents) for a specific booking.
 * Enables setting costs on day combos or custom excursions seeded without cost,
 * unlocking them from MISSING_COST status for monthly settlement.
 * Accessible ONLY to PLATFORM_ADMIN.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN]);
    const { id: bookingId } = await context.params;

    const body = await request.json();
    const rawCost = body.costCents;
    const notes = body.notes ? String(body.notes).trim() : undefined;

    if (rawCost === undefined || rawCost === null || isNaN(Number(rawCost)) || Number(rawCost) < 0) {
      return NextResponse.json(
        { error: 'Valid costCents (non-negative integer in cents) is required.' },
        { status: 400 }
      );
    }

    const newCostCents = Math.round(Number(rawCost));

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { operator: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: `Booking ${bookingId} not found.` },
        { status: 404 }
      );
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    const previousCost = booking.costCents;
    const previousCommissionStatus = booking.commissionStatus;

    // Recalculate economics if completed and paid
    let profitCents = booking.profitCents;
    let commissionRate = booking.commissionRate;
    let commissionAmountCents = booking.commissionAmountCents;
    let commissionStatus = booking.commissionStatus;

    if (booking.status === 'COMPLETED' && booking.paymentStatus === 'PAID_IN_FULL') {
      const effectiveRate = await resolveEffectiveCommissionRate(booking.operatorId);
      const amountPaid = booking.amountPaidCents || booking.totalPriceCents || 0;
      const computed = calculateCommission(amountPaid, newCostCents, effectiveRate);

      profitCents = computed.profitCents;
      commissionRate =
        computed.commissionRate !== null
          ? new Prisma.Decimal((computed.commissionRate / 100).toFixed(4))
          : null;
      commissionAmountCents = computed.commissionAmountCents;
      commissionStatus = computed.status;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        costCents: newCostCents,
        costOverrideNotes: notes || booking.costOverrideNotes,
        profitCents,
        commissionRate,
        commissionAmountCents,
        commissionStatus,
      },
    });

    // Write to AuditLog
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_BOOKING_COST',
        entityType: 'Booking',
        entityId: booking.id,
        details: {
          referenceCode: booking.referenceCode,
          previousCostCents: previousCost,
          newCostCents,
          previousCommissionStatus,
          newCommissionStatus: commissionStatus,
          notes,
        },
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: updatedBooking.id,
        referenceCode: updatedBooking.referenceCode,
        costCents: updatedBooking.costCents,
        profitCents: updatedBooking.profitCents,
        commissionRate: updatedBooking.commissionRate ? Number(updatedBooking.commissionRate) * 100 : null,
        commissionAmountCents: updatedBooking.commissionAmountCents,
        commissionStatus: updatedBooking.commissionStatus,
        costOverrideNotes: updatedBooking.costOverrideNotes,
      },
      message: `Successfully updated cost for booking ${booking.referenceCode}. Commission status: ${commissionStatus}.`,
    });
  } catch (error: any) {
    console.error('Error updating booking cost:', error);
    const isAuthError =
      error?.message?.includes('Forbidden') || error?.message?.includes('Unauthorized');
    return NextResponse.json(
      { error: error?.message || 'Failed to update booking cost.' },
      { status: isAuthError ? 403 : 500 }
    );
  }
}
