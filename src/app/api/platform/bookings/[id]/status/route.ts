import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import {
  assertConfirmationAllowed,
  assertManualStatusTransitionAllowed,
} from '@/lib/services/booking-gate';
import { sendBookingCancelledNotification } from '@/lib/services/email-service';
import { Role, BookingStatus, Prisma } from '@prisma/client';
import { updateBookingStatusSchema } from '@/lib/validations/payment';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN, Role.COMPANY_ADMIN]);
    const { id: bookingId } = await context.params;

    const body = await request.json();
    const parseResult = updateBookingStatusSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid status details. Please check all fields.',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status: targetStatus, reason, operatorNotes } = parseResult.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tour: true,
        transportService: true,
        route: true,
        operator: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    // Enforce manual transition guardrails
    assertManualStatusTransitionAllowed(
      booking.status,
      targetStatus,
      booking.paymentStatus,
      reason
    );

    // Invariant confirmation check
    assertConfirmationAllowed(targetStatus, booking.paymentStatus);

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // If moving to COMPLETED, snapshot commission economics (feeding B4 engine)
    let profitCents = booking.profitCents;
    let commissionRate = booking.commissionRate;
    let commissionAmountCents = booking.commissionAmountCents;
    let commissionStatus = booking.commissionStatus;

    if (targetStatus === BookingStatus.COMPLETED) {
      const { resolveEffectiveCommissionRate, calculateCommission } = await import(
        '@/lib/commission'
      );
      const effectiveRate = await resolveEffectiveCommissionRate(booking.operatorId);
      const computed = calculateCommission(
        booking.amountPaidCents || booking.totalPriceCents || 0,
        booking.costCents,
        effectiveRate
      );

      profitCents = computed.profitCents;
      commissionRate =
        computed.commissionRate !== null
          ? new Prisma.Decimal((computed.commissionRate / 100).toFixed(4))
          : null;
      commissionAmountCents = computed.commissionAmountCents;
      commissionStatus = computed.status;
    }

    const isCancellation =
      targetStatus === BookingStatus.CANCELLED || targetStatus === BookingStatus.REJECTED;

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: targetStatus,
        confirmedAt:
          targetStatus === BookingStatus.CONFIRMED
            ? booking.confirmedAt || new Date()
            : booking.confirmedAt,
        cancelledAt: isCancellation ? new Date() : booking.cancelledAt,
        cancellationReason: isCancellation ? reason?.trim() : booking.cancellationReason,
        operatorNotes: operatorNotes !== undefined && operatorNotes !== null ? operatorNotes : booking.operatorNotes,
        ...(targetStatus === BookingStatus.COMPLETED
          ? {
              profitCents,
              commissionRate: commissionRate !== null ? commissionRate : null,
              commissionAmountCents,
              commissionStatus,
            }
          : {}),
      },
      include: {
        payments: { orderBy: { createdAt: 'desc' } },
        tour: true,
        route: true,
      },
    });

    const auditAction =
      targetStatus === BookingStatus.COMPLETED ? 'BOOKING_COMPLETED' : 'STATUS_CHANGED';

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: auditAction,
        entityType: 'Booking',
        entityId: booking.id,
        details: {
          referenceCode: booking.referenceCode,
          previousStatus: booking.status,
          newStatus: targetStatus,
          paymentStatus: booking.paymentStatus,
          reason: isCancellation ? reason?.trim() : undefined,
          profitCents,
          commissionRate,
          commissionAmountCents,
          operatorNotes,
        },
        ipAddress: clientIp,
      },
    });

    // If cancelled or rejected, dispatch cancellation email
    if (isCancellation) {
      const serviceTitle =
        booking.serviceType === 'TOUR'
          ? booking.tour?.title || 'Zanzibar Tour'
          : `${booking.pickupLocation || 'Pickup'} → ${booking.dropoffLocation || 'Drop-off'}`;

      sendBookingCancelledNotification({
        bookingId: booking.id,
        referenceCode: booking.referenceCode,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        serviceTitle,
        bookingDate: new Date(booking.bookingDate).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        status: targetStatus,
        reason: reason?.trim() || 'Internal operational adjustment',
      }).catch((err) => console.error('Failed to send cancellation email:', err));
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message:
        targetStatus === BookingStatus.COMPLETED
          ? 'Tour completed successfully. Profit & commission economics recorded.'
          : `Booking status updated to ${targetStatus}.`,
    });
  } catch (error: any) {
    console.error('Error updating status in platform:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update status.' },
      { status: error?.message?.includes('Invariant') ? 400 : 500 }
    );
  }
}
