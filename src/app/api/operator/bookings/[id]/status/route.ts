import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { assertManualStatusTransitionAllowed } from '@/lib/services/booking-gate';
import { sendTourCompletedNotification } from '@/lib/services/email-service';
import { toOperatorBookingDto } from '@/lib/serialization';
import { Role, BookingStatus, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * P1 — OPERATOR completion endpoint. The ONLY status change an operator may
 * perform is CONFIRMED → COMPLETED, and only for bookings forwarded to them
 * (i.e. having at least one OperatorInbox message) within their scope.
 * Everything else (cancel, reject, payments) is super-admin only.
 * Responses are serialized via toOperatorBookingDto — zero financial data.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
    const { id: bookingId } = await context.params;

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    if (body.status !== BookingStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Operators may only mark tours as COMPLETED.' },
        { status: 403 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tour: true,
        transportService: true,
        route: true,
        operator: true,
        inboxMessages: {
          orderBy: { sentAt: 'desc' },
          select: { id: true, sentAt: true, readAt: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    // Operator scope: can only complete own operator's bookings
    if (user.role === Role.OPERATOR && user.operatorId && booking.operatorId !== user.operatorId) {
      return NextResponse.json(
        { error: 'Forbidden: This booking was not assigned to you.' },
        { status: 403 }
      );
    }

    // Forwarded-only visibility: operator learns about bookings via inbox
    if (booking.inboxMessages.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden: This booking has not been forwarded to the operator.' },
        { status: 403 }
      );
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      return NextResponse.json(
        { error: `Only CONFIRMED tours can be marked completed (current: ${booking.status}).` },
        { status: 400 }
      );
    }

    // Invariant: only CONFIRMED + PAID_IN_FULL tours can be completed
    assertManualStatusTransitionAllowed(booking.status, BookingStatus.COMPLETED, booking.paymentStatus);

    // Snapshot commission economics for super-admin finalization
    const { resolveEffectiveCommissionRate, calculateCommission } = await import(
      '@/lib/commission'
    );
    const effectiveRate = await resolveEffectiveCommissionRate(booking.operatorId);
    const computed = calculateCommission(
      booking.amountPaidCents || booking.totalPriceCents || 0,
      booking.costCents,
      effectiveRate
    );

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.COMPLETED,
        profitCents: computed.profitCents,
        commissionRate:
          computed.commissionRate !== null
            ? new Prisma.Decimal((computed.commissionRate / 100).toFixed(4))
            : null,
        commissionAmountCents: computed.commissionAmountCents,
        commissionStatus: computed.status,
      },
      include: {
        tour: true,
        route: true,
        inboxMessages: {
          orderBy: { sentAt: 'desc' },
          take: 5,
          select: { id: true, sentAt: true, readAt: true },
        },
      },
    });

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TOUR_COMPLETED_BY_OPERATOR',
        entityType: 'Booking',
        entityId: booking.id,
        details: {
          referenceCode: booking.referenceCode,
          previousStatus: booking.status,
          newStatus: BookingStatus.COMPLETED,
          operatorName: user.name,
        },
        ipAddress: clientIp,
      },
    });

    // Notify super admin (in-app Notification row + email)
    const serviceTitle =
      booking.serviceType === 'TOUR'
        ? booking.tour?.title || 'Zanzibar Tour'
        : `${booking.pickupLocation || 'Pickup'} → ${booking.dropoffLocation || 'Drop-off'}`;

    try {
      await sendTourCompletedNotification({
        bookingId: booking.id,
        referenceCode: booking.referenceCode,
        serviceTitle,
        bookingDate: new Date(booking.bookingDate).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        bookingTime: booking.bookingTime || undefined,
        customerName: booking.customerName,
        operatorName:
          booking.operator?.companyName || booking.operator?.businessName || user.name || 'Operator',
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[OperatorStatus] Failed to dispatch completion notification:', err);
    }

    return NextResponse.json({
      success: true,
      booking: toOperatorBookingDto(updatedBooking),
      message: `Tour ${booking.referenceCode} marked as COMPLETED. Super admin has been notified.`,
    });
  } catch (error: any) {
    console.error('Error completing tour:', error);
    const msg = error?.message || 'Failed to mark tour as completed.';
    const status =
      msg.includes('403') || msg.includes('Forbidden') ? 403
      : msg.includes('Invariant') || msg.includes('Only CONFIRMED') || msg.includes('Cannot complete') ? 400
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
