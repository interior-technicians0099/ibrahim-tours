import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { assertConfirmationAllowed } from '@/lib/services/booking-gate';
import { sendBookingConfirmedNotifications } from '@/lib/services/email-service';
import { Role, BookingStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { formatPrice } from '@/lib/utils';
import { recordPaymentSchema } from '@/lib/validations/payment';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
    const { id: bookingId } = await context.params;

    const body = await request.json();
    const parseResult = recordPaymentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid payment details. Please check all fields.',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { amountPaidCents, paymentMethod, paymentReference, operatorNotes, notes } = parseResult.data;
    const paymentDate = parseResult.data.paymentDate
      ? new Date(parseResult.data.paymentDate)
      : new Date();

    // 1. Fetch booking & verify operator scope
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

    if (user.role === Role.OPERATOR && user.operatorId && booking.operatorId !== user.operatorId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to record payments for this booking.' },
        { status: 403 }
      );
    }

    // 2. Create discrete Payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amountPaidCents,
        paymentMethod,
        paymentDate,
        paymentReference: paymentReference || null,
        notes: notes || operatorNotes || null,
        recordedById: user.id,
      },
    });

    // 3. Compute cumulative payments & target price
    const allPayments = await prisma.payment.findMany({
      where: { bookingId: booking.id },
    });
    const newTotalPaid = allPayments.reduce((sum, p) => sum + p.amountPaidCents, 0);
    const targetPrice = booking.quotedPriceCents || booking.totalPriceCents || 0;

    let newPaymentStatus: PaymentStatus = PaymentStatus.NOT_PAID;
    let newBookingStatus: BookingStatus = booking.status;
    let confirmedAt: Date | null = booking.confirmedAt || null;

    if (newTotalPaid >= targetPrice) {
      newPaymentStatus = PaymentStatus.PAID_IN_FULL;
      // Invariant rule: PAID_IN_FULL auto-confirms booking
      newBookingStatus = BookingStatus.CONFIRMED;
      confirmedAt = booking.confirmedAt || new Date();
    } else if (newTotalPaid > 0) {
      newPaymentStatus = PaymentStatus.PARTIALLY_PAID;
      if (booking.status === BookingStatus.REQUESTED || booking.status === BookingStatus.UNDER_REVIEW) {
        newBookingStatus = BookingStatus.AWAITING_PAYMENT;
      }
    }

    // Double-check invariant gate
    assertConfirmationAllowed(newBookingStatus, newPaymentStatus);

    // 4. Profit snapshot calculation
    const costCents = booking.costCents;
    const profitCents = costCents != null ? targetPrice - costCents : null;

    // Resolve client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // 5. Atomic update + AuditLog creation
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        amountPaidCents: newTotalPaid,
        paymentStatus: newPaymentStatus,
        paymentMethod,
        paymentReference: paymentReference || booking.paymentReference,
        paymentDate,
        status: newBookingStatus,
        confirmedAt,
        profitCents,
        recordedById: user.id,
        operatorNotes: operatorNotes || notes || booking.operatorNotes,
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          include: { recordedBy: { select: { name: true } } },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PAYMENT_RECORDED',
        entityType: 'Booking',
        entityId: booking.id,
        details: {
          referenceCode: booking.referenceCode,
          paymentId: payment.id,
          amountAddedCents: amountPaidCents,
          totalPaidCents: newTotalPaid,
          targetPriceCents: targetPrice,
          paymentMethod,
          paymentReference,
          previousPaymentStatus: booking.paymentStatus,
          newPaymentStatus,
          previousStatus: booking.status,
          newStatus: newBookingStatus,
          autoConfirmed: newPaymentStatus === PaymentStatus.PAID_IN_FULL,
        },
        ipAddress: clientIp,
      },
    });

    // 6. Send CONFIRMED notifications if fully paid
    if (newPaymentStatus === PaymentStatus.PAID_IN_FULL) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const serviceTitle =
        booking.serviceType === 'TOUR'
          ? booking.tour?.title || 'Tour'
          : `${booking.pickupLocation || 'Pickup'} → ${booking.dropoffLocation || 'Drop-off'}`;

      const confirmedDetails = {
        bookingId: booking.id,
        referenceCode: booking.referenceCode,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        serviceTitle,
        bookingDate: new Date(booking.bookingDate).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        bookingTime: booking.bookingTime || 'Morning',
        pickupLocation: booking.pickupLocation || 'To be confirmed',
        amountPaidFormatted: formatPrice(Math.round(newTotalPaid / 100)),
        totalPriceFormatted: formatPrice(Math.round(targetPrice / 100)),
        paymentMethod: paymentMethod.replace('_', ' '),
        paymentReference: paymentReference || undefined,
        profitFormatted: profitCents ? formatPrice(Math.round(profitCents / 100)) : null,
        operatorName: booking.operator?.name || 'Ibrahim',
      };

      sendBookingConfirmedNotifications(confirmedDetails, baseUrl).catch((err) =>
        console.error('Failed to dispatch confirmed notification:', err)
      );
    }

    const remainingCents = Math.max(0, targetPrice - newTotalPaid);

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      payment,
      autoConfirmed: newPaymentStatus === PaymentStatus.PAID_IN_FULL,
      remainingCents,
      remainingFormatted: formatPrice(Math.round(remainingCents / 100)),
      message:
        newPaymentStatus === PaymentStatus.PAID_IN_FULL
          ? `Full payment of ${formatPrice(
              Math.round(amountPaidCents / 100)
            )} recorded. Booking is officially CONFIRMED.`
          : `Partial payment of ${formatPrice(
              Math.round(amountPaidCents / 100)
            )} recorded. Remaining balance: ${formatPrice(Math.round(remainingCents / 100))}.`,
    });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to record payment.' },
      { status: error?.message?.includes('Invariant') ? 400 : 500 }
    );
  }
}
