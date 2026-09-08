import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingPayloadSchema } from '@/lib/validations/booking';
import { checkBookingRateLimit } from '@/lib/booking-rate-limiter';
import { sendBookingNotifications } from '@/lib/services/email-service';
import { ALL_TOURS, TRANSFER_ROUTES, OPERATOR } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { ServiceType, BookingStatus, PaymentStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // 1. Resolve client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // 2. IP Rate Limiting (10 per hour)
    const rateCheck = checkBookingRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many booking requests from this IP. Please try again in ${rateCheck.retryAfterMinutes} minutes, or contact Ibrahim directly on WhatsApp (+255 700 000 000).`,
        },
        { status: 429 }
      );
    }

    // 3. Parse & Validate Payload
    const body = await request.json();

    // 4. Honeypot check for spam bots
    if (body.honeypot && String(body.honeypot).trim().length > 0) {
      // Quietly reject spam bot submission
      return NextResponse.json({
        success: true,
        referenceCode: 'ZNZ-2026-REQ-VERIFIED',
      });
    }

    const parseResult = BookingPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return NextResponse.json(
        { error: issue?.message || 'Invalid booking details provided' },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // 5. Look up Operator Profile for payment instructions
    const operator =
      (await prisma.operatorProfile.findUnique({ where: { id: 'operator-ibrahim' } })) ||
      (await prisma.operatorProfile.findFirst()) || {
        id: 'operator-ibrahim',
        name: 'Ibrahim',
        paymentInstructions:
          'Your booking request has been reviewed and confirmed. To secure your reservation, please send the full payment to the M-Pesa number or Bank Account provided below. Your booking is confirmed only when full payment is received.',
        paymentNotes: 'Please include your booking reference in the transfer description.',
        mpesaNumber: '+255 777 123 456',
        bankName: 'CRDB Bank Zanzibar',
        bankAccount: '0152849201900',
        whatsapp: '+255 777 123 456',
      };

    // 6. Generate non-guessable alphanumeric reference code like ZNZ-2026-XXXXXX
    const year = new Date().getFullYear();
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let randomSuffix = '';
    for (let i = 0; i < 6; i++) {
      randomSuffix += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    const referenceCode = `ZNZ-${year}-${randomSuffix}`;

    // 7. Calculate Pricing & Snapshot Private Cost
    let serviceTitle = '';
    let tierName: string = '';
    let totalPriceCents = 0;
    let costCents: number | null = null;
    let tourId: string | null = null;
    let transportServiceId: string | null = null;
    let routeId: string | null = null;
    let assignedOperatorId: string = operator.id;
    let pickupLocation = data.pickupLocation;
    let dropoffLocation: string | null = null;
    let guestsText = '';
    let bookingDate: Date;
    let bookingTime: string;

    if (data.serviceType === 'TOUR') {
      bookingDate = new Date(data.tourDate);
      bookingTime = data.tourTime || '08:30 AM';
      guestsText = `${data.numAdults} Adult${data.numAdults > 1 ? 's' : ''}${
        data.numChildren > 0 ? `, ${data.numChildren} Child${data.numChildren > 1 ? 'ren' : ''}` : ''
      }`;

      // Query database Tour or match constant
      const dbTour = await prisma.tour.findUnique({
        where: { slug: data.tourSlug },
      });
      if (dbTour?.operatorId) {
        assignedOperatorId = dbTour.operatorId;
      }
      const staticTour = ALL_TOURS.find((t) => t.slug === data.tourSlug) || ALL_TOURS[0];
      serviceTitle = dbTour?.title || staticTour.title;
      tourId = dbTour?.id || null;

      const pricing = (dbTour?.pricingTiers as any) || staticTour.pricing;

      if (data.numAdults === 1) {
        tierName = 'single';
        totalPriceCents = pricing.single?.priceCents ?? (pricing.single * 100);
        costCents = pricing.single?.costCents ?? Math.round(totalPriceCents * 0.75);
      } else if (data.numAdults === 2) {
        tierName = 'couple';
        totalPriceCents = pricing.couple?.priceCents ?? (pricing.couple * 100);
        costCents = pricing.couple?.costCents ?? Math.round(totalPriceCents * 0.7);
      } else if (data.numAdults >= 5 && (pricing.group5to10?.priceCents || pricing.group5to10)) {
        tierName = 'group5to10';
        const perPersonPrice = pricing.group5to10?.priceCents ?? (pricing.group5to10 * 100);
        totalPriceCents = perPersonPrice * data.numAdults;
        const perPersonCost = pricing.group5to10?.costCents ?? null;
        costCents = perPersonCost ? perPersonCost * data.numAdults : null;
      } else {
        tierName = 'custom';
        const baseCouple = pricing.couple?.priceCents ?? (pricing.couple * 100);
        const extraAdultRate = (pricing.group5to10?.priceCents ?? 4000);
        totalPriceCents = baseCouple + (data.numAdults - 2) * extraAdultRate;
        costCents = null;
      }
    } else {
      // TRANSPORT
      bookingDate = new Date(data.transportDate);
      bookingTime = data.transportTime || '12:00 PM';
      guestsText = `${data.passengers} Passenger${data.passengers > 1 ? 's' : ''} (${data.luggageCount || '2 Bags'})`;
      pickupLocation = data.pickupLocation;
      dropoffLocation = data.dropoffLocation;

      const dbRoute = await prisma.route.findUnique({
        where: { id: data.routeId },
        include: { transportService: true },
      });
      if (dbRoute?.transportService?.operatorId) {
        assignedOperatorId = dbRoute.transportService.operatorId;
      }
      const staticRoute = TRANSFER_ROUTES.find((r) => r.id === data.routeId) || TRANSFER_ROUTES[0];
      routeId = dbRoute?.id || null;
      transportServiceId = dbRoute?.transportServiceId || null;
      serviceTitle = `${pickupLocation} → ${dropoffLocation}`;

      const pricing = (dbRoute?.pricingTiers as any) || staticRoute.pricing;

      if (data.passengers <= 3) {
        tierName = 'van1to3';
        totalPriceCents = pricing.van1to3?.priceCents ?? (pricing.van1to3 * 100);
      } else if (data.passengers <= 6) {
        tierName = 'van4to6';
        totalPriceCents = pricing.van4to6?.priceCents ?? (pricing.van4to6 * 100);
      } else if (data.passengers <= 12) {
        tierName = 'miniBus7to12';
        totalPriceCents = pricing.miniBus7to12?.priceCents ?? (pricing.miniBus7to12 * 100);
      } else {
        tierName = 'bigBus13to25';
        totalPriceCents = pricing.bigBus13to25?.priceCents ?? (pricing.bigBus13to25 * 100);
      }
      costCents = null; // Transport cost determined upon vehicle dispatch
    }

    // 8. Create Booking in database:
    // status = REQUESTED (new booking request state)
    // paymentStatus = NOT_PAID (unpaid, waiting for operator confirmation and full payment)
    // No online payment processed
    const booking = await prisma.booking.create({
      data: {
        referenceCode,
        serviceType: data.serviceType === 'TOUR' ? ServiceType.TOUR : ServiceType.TRANSPORT,
        tourId,
        transportServiceId,
        routeId,
        operatorId: assignedOperatorId,
        tier: tierName,
        customerName: data.fullName,
        customerEmail: data.email,
        customerPhone: data.phone,
        customerCountry: data.country || 'United Kingdom',
        locale: data.locale || 'en',
        bookingDate,
        bookingTime,
        numAdults: data.serviceType === 'TOUR' ? data.numAdults : data.passengers,
        numChildren: data.serviceType === 'TOUR' ? data.numChildren : 0,
        pickupLocation,
        dropoffLocation,
        specialRequests: data.specialRequests || null,
        status: BookingStatus.REQUESTED,
        paymentStatus: PaymentStatus.NOT_PAID,
        amountPaidCents: 0,
        quotedPriceCents: totalPriceCents,
        totalPriceCents,
        costCents,
        profitCents: costCents ? totalPriceCents - costCents : null,
        commissionRate: null, // Settled later during monthly audit
        commissionAmountCents: null,
      },
    });

    // 9. Write Booking Creation to AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'BOOKING_CREATED',
        entityType: 'Booking',
        entityId: booking.id,
        details: {
          referenceCode: booking.referenceCode,
          serviceType: booking.serviceType,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          quotedPriceCents: booking.quotedPriceCents,
          totalPriceCents: booking.totalPriceCents,
          costCents: booking.costCents,
          tier: booking.tier,
          locale: booking.locale,
        },
        ipAddress: clientIp,
      },
    });

    // 10. Trigger Resend Transactional Emails (Tourist & Operator)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const emailDetails = {
      id: booking.id,
      referenceCode: booking.referenceCode,
      serviceType: data.serviceType,
      title: serviceTitle,
      date: bookingDate.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: bookingTime,
      guestsText,
      pickupLocation,
      dropoffLocation: dropoffLocation || undefined,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      customerCountry: booking.customerCountry || 'United Kingdom',
      specialRequests: booking.specialRequests || undefined,
      totalPriceFormatted: formatPrice(Math.round(totalPriceCents / 100)),
      paymentInstructions: operator.paymentInstructions,
      mpesaNumber: operator.mpesaNumber,
      bankName: operator.bankName,
      bankAccount: operator.bankAccount,
      paymentNotes: operator.paymentNotes,
      locale: booking.locale,
      operatorWhatsApp: (operator as any).whatsapp || undefined,
    };

    // Fire emails asynchronously (never blocks response)
    sendBookingNotifications(emailDetails, baseUrl).catch((e) =>
      console.error('Async email notification error:', e)
    );

    return NextResponse.json({
      success: true,
      referenceCode: booking.referenceCode,
      bookingId: booking.id,
      redirectUrl: `/book/confirmation/${booking.referenceCode}`,
    });
  } catch (error: any) {
    console.error('Error creating booking request:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process booking request. Please try again.' },
      { status: 500 }
    );
  }
}
