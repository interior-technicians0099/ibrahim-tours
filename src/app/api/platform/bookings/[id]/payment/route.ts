import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { assertConfirmationAllowed } from '@/lib/services/booking-gate';
import {
  sendBookingConfirmedNotifications,
  sendWorkOrderNotification,
  buildWorkOrderWhatsAppUrl,
} from '@/lib/services/email-service';
import { issueBookingReceipt, generateReceiptQrDataUrl } from '@/lib/services/receipt-service';
import { getCompanyProfile } from '@/lib/company';
import { Role, BookingStatus, PaymentStatus } from '@prisma/client';
import { formatPrice } from '@/lib/utils';
import { recordPaymentSchema } from '@/lib/validations/payment';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN, Role.COMPANY_ADMIN]);
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

    // 1. Fetch booking
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
    let workOrderSentAt: Date | null = booking.workOrderSentAt || null;

    if (newTotalPaid >= targetPrice) {
      newPaymentStatus = PaymentStatus.PAID_IN_FULL;
      // Invariant rule: PAID_IN_FULL auto-confirms booking
      newBookingStatus = BookingStatus.CONFIRMED;
      confirmedAt = booking.confirmedAt || new Date();
      workOrderSentAt = booking.workOrderSentAt || new Date();
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
        workOrderSentAt,
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

    let workOrderWhatsAppUrl: string | null = null;
    let issuedReceipt: any = null;

    // 6. When PAID_IN_FULL achieved: issue receipt, send CONFIRMED to Tourist & WORK ORDER to Ibrahim
    if (newPaymentStatus === PaymentStatus.PAID_IN_FULL) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const companyProfile = await getCompanyProfile();

      // Auto-issue official branded receipt
      try {
        issuedReceipt = await issueBookingReceipt({
          bookingId: booking.id,
          amountPaidCents: newTotalPaid,
          paymentMethod,
          paymentReference: paymentReference || booking.paymentReference,
          issuedById: user.id,
          notes: notes || operatorNotes || null,
        });
      } catch (receiptErr) {
        console.error('[PaymentRoute] Failed to auto-issue receipt:', receiptErr);
      }

      const receiptUrl = issuedReceipt ? `${baseUrl}/receipt/${issuedReceipt.receiptNumber}` : undefined;
      const qrDataUrl = receiptUrl ? await generateReceiptQrDataUrl(receiptUrl) : undefined;

      const serviceTitle =
        booking.serviceType === 'TOUR'
          ? booking.tour?.title || 'Zanzibar Tour'
          : `${booking.pickupLocation || 'Pickup'} → ${booking.dropoffLocation || 'Drop-off'}`;

      const dateDisplay = new Date(booking.bookingDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      // A. Send confirmation & official receipt to Tourist (NEVER leaks costs or profits)
      const confirmedDetails = {
        bookingId: booking.id,
        referenceCode: booking.referenceCode,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        serviceTitle,
        bookingDate: dateDisplay,
        bookingTime: booking.bookingTime || 'Morning',
        pickupLocation: booking.pickupLocation || 'To be confirmed',
        amountPaidFormatted: formatPrice(Math.round(newTotalPaid / 100)),
        totalPriceFormatted: formatPrice(Math.round(targetPrice / 100)),
        paymentMethod: paymentMethod.replace(/_/g, ' '),
        paymentReference: paymentReference || undefined,
        profitFormatted: profitCents ? formatPrice(Math.round(profitCents / 100)) : null,
        operatorName: companyProfile.companyName,
        receiptNumber: issuedReceipt?.receiptNumber,
        verificationCode: issuedReceipt?.verificationCode,
        receiptUrl,
        qrDataUrl,
        leadGuideName: companyProfile.leadGuideName,
        leadGuidePhone: companyProfile.leadGuidePhone,
      };

      try {
        await sendBookingConfirmedNotifications(confirmedDetails, baseUrl);
      } catch (err) {
        console.error('[PaymentRoute] Failed to dispatch tourist confirmed notification:', err);
      }

      // B. Send official Work Order email to Ibrahim (lead guide) with Uhakiki code
      const workOrderDetails = {
        bookingId: booking.id,
        referenceCode: booking.referenceCode,
        locale: booking.locale || 'en',
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        customerCountry: booking.customerCountry || undefined,
        serviceTitle,
        serviceType: booking.serviceType,
        bookingDate: dateDisplay,
        bookingTime: booking.bookingTime || undefined,
        adults: booking.numAdults,
        children: booking.numChildren,
        pickupLocation: booking.pickupLocation || 'Stone Town / Hotel lobby',
        dropoffLocation: booking.dropoffLocation || undefined,
        amountPaid: Math.round(newTotalPaid / 100),
        currency: 'USD',
        specialRequests: booking.specialRequests || undefined,
        leadGuideName: companyProfile.leadGuideName || 'Ibrahim',
        leadGuideEmail: companyProfile.leadGuideEmail || companyProfile.officialEmail,
        leadGuidePhone: companyProfile.leadGuidePhone || companyProfile.officialPhone,
        leadGuideWhatsApp: companyProfile.leadGuideWhatsApp || companyProfile.officialWhatsapp,
        receiptNumber: issuedReceipt?.receiptNumber,
        verificationCode: issuedReceipt?.verificationCode,
      };

      try {
        await sendWorkOrderNotification(workOrderDetails, baseUrl);
      } catch (err) {
        console.error('[PaymentRoute] Failed to dispatch Ibrahim work order email:', err);
      }

      // C. Build WhatsApp link to Ibrahim for Platform Admin one-tap access with Uhakiki code
      workOrderWhatsAppUrl = buildWorkOrderWhatsAppUrl({
        leadGuidePhone: companyProfile.leadGuidePhone || companyProfile.officialPhone,
        referenceCode: booking.referenceCode,
        locale: booking.locale || 'en',
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerCountry: booking.customerCountry || undefined,
        serviceTitle,
        tourDate: dateDisplay,
        bookingTime: booking.bookingTime || undefined,
        adults: booking.numAdults,
        children: booking.numChildren,
        pickupLocation: booking.pickupLocation || undefined,
        dropoffLocation: booking.dropoffLocation || undefined,
        amountPaid: Math.round(newTotalPaid / 100),
        currency: 'USD',
        specialRequests: booking.specialRequests || undefined,
        receiptNumber: issuedReceipt?.receiptNumber,
        verificationCode: issuedReceipt?.verificationCode,
      });

      // D. Audit log for WORK_ORDER_SENT
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'WORK_ORDER_SENT',
          entityType: 'Booking',
          entityId: booking.id,
          details: {
            referenceCode: booking.referenceCode,
            leadGuideName: companyProfile.leadGuideName,
            leadGuidePhone: companyProfile.leadGuidePhone,
            leadGuideEmail: companyProfile.leadGuideEmail,
            locale: booking.locale,
            receiptNumber: issuedReceipt?.receiptNumber,
            verificationCode: issuedReceipt?.verificationCode,
          },
          ipAddress: clientIp,
        },
      });
    }

    const remainingCents = Math.max(0, targetPrice - newTotalPaid);

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      payment,
      receipt: issuedReceipt,
      autoConfirmed: newPaymentStatus === PaymentStatus.PAID_IN_FULL,
      remainingCents,
      remainingFormatted: formatPrice(Math.round(remainingCents / 100)),
      workOrderWhatsAppUrl,
      message:
        newPaymentStatus === PaymentStatus.PAID_IN_FULL
          ? `Full payment of ${formatPrice(
              Math.round(amountPaidCents / 100)
            )} recorded. Official Receipt ${issuedReceipt ? issuedReceipt.receiptNumber : ''} issued, Booking CONFIRMED, and Work Order dispatched.`
          : `Partial payment of ${formatPrice(
              Math.round(amountPaidCents / 100)
            )} recorded. Remaining balance: ${formatPrice(Math.round(remainingCents / 100))}.`,
    });
  } catch (error: any) {
    console.error('Error recording payment in platform:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to record payment.' },
      { status: error?.message?.includes('Invariant') ? 400 : 500 }
    );
  }
}
