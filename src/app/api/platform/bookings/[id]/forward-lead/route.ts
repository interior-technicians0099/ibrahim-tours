import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { getCompanyProfile } from '@/lib/company';
import { buildForwardLeadWhatsAppUrl } from '@/lib/services/email-service';

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

    const companyProfile = await getCompanyProfile();
    const leadGuidePhone = companyProfile.leadGuidePhone || companyProfile.officialPhone || '+255618769150';

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

    const whatsAppUrl = buildForwardLeadWhatsAppUrl({
      leadGuidePhone,
      referenceCode: booking.referenceCode,
      locale: booking.locale || 'en',
      customerName: booking.customerName,
      customerCountry: booking.customerCountry || undefined,
      serviceTitle,
      tourDate,
      adults: booking.numAdults,
      children: booking.numChildren,
      pickupLocation: booking.pickupLocation || undefined,
    });

    const now = new Date();
    await prisma.booking.update({
      where: { id: booking.id },
      data: { leadForwardedAt: now },
    });

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LEAD_FORWARDED',
        entityType: 'Booking',
        entityId: booking.id,
        details: {
          referenceCode: booking.referenceCode,
          leadGuidePhone,
          locale: booking.locale,
          serviceTitle,
          tourDate,
        },
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      whatsAppUrl,
      leadForwardedAt: now,
      message: `Lead forwarded to Ibrahim (${leadGuidePhone})`,
    });
  } catch (error: any) {
    console.error('Error forwarding lead:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to forward lead.' },
      { status: 500 }
    );
  }
}
