import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import {
  sendGuideIntroNotification,
  buildGuideIntroWhatsAppUrl,
} from '@/lib/services/email-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN, Role.COMPANY_ADMIN]);
    const { id: bookingId } = await context.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tour: true,
        transportService: true,
        route: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    if (!booking.guideName || !booking.guidePhone) {
      return NextResponse.json(
        { error: 'Cannot send guide intro: Guide Name and Phone must be recorded first.' },
        { status: 400 }
      );
    }

    const serviceTitle =
      booking.serviceType === 'TOUR'
        ? booking.tour?.title || 'Zanzibar Tour'
        : `${booking.pickupLocation || 'Pickup'} → ${booking.dropoffLocation || 'Drop-off'}`;

    const tourDate = new Date(booking.bookingDate).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    // 1. Dispatch email to tourist
    const introDetails = {
      bookingId: booking.id,
      referenceCode: booking.referenceCode,
      locale: booking.locale || 'en',
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      guideName: booking.guideName,
      guidePhone: booking.guidePhone,
      serviceTitle,
      bookingDate: tourDate,
      bookingTime: booking.bookingTime || undefined,
      pickupLocation: booking.pickupLocation || undefined,
    };

    sendGuideIntroNotification(introDetails).catch((err) =>
      console.error('[SendGuideIntro] Failed to dispatch email:', err)
    );

    // 2. Build WhatsApp message for tourist
    const whatsAppUrl = buildGuideIntroWhatsAppUrl({
      touristPhone: booking.customerPhone,
      referenceCode: booking.referenceCode,
      locale: booking.locale || 'en',
      customerName: booking.customerName,
      guideName: booking.guideName,
      guidePhone: booking.guidePhone,
      serviceTitle,
      tourDate,
    });

    // 3. Audit log
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'GUIDE_INTRO_SENT',
        entityType: 'Booking',
        entityId: booking.id,
        details: {
          referenceCode: booking.referenceCode,
          guideName: booking.guideName,
          guidePhone: booking.guidePhone,
          touristEmail: booking.customerEmail,
          touristPhone: booking.customerPhone,
          locale: booking.locale,
        },
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      whatsAppUrl,
      message: `Guide intro dispatched to ${booking.customerName} (${booking.customerEmail})`,
    });
  } catch (error: any) {
    console.error('Error sending guide intro:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send guide intro.' },
      { status: 500 }
    );
  }
}
