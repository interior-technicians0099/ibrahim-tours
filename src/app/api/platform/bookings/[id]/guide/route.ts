import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN, Role.COMPANY_ADMIN]);
    const { id: bookingId } = await context.params;

    const body = await request.json();
    const { guideName, guidePhone, guideNotes } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    const isFirstAssignment = !booking.guideName && Boolean(guideName);

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        guideName: guideName ? String(guideName).trim() : null,
        guidePhone: guidePhone ? String(guidePhone).trim() : null,
        guideNotes: guideNotes !== undefined ? (guideNotes ? String(guideNotes).trim() : null) : booking.guideNotes,
      },
    });

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: isFirstAssignment ? 'GUIDE_ASSIGNED' : 'GUIDE_UPDATED',
        entityType: 'Booking',
        entityId: booking.id,
        details: {
          referenceCode: booking.referenceCode,
          previousGuideName: booking.guideName,
          previousGuidePhone: booking.guidePhone,
          newGuideName: updatedBooking.guideName,
          newGuidePhone: updatedBooking.guidePhone,
          guideNotes: updatedBooking.guideNotes,
        },
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: isFirstAssignment
        ? `Guide ${updatedBooking.guideName} assigned successfully.`
        : 'Guide details updated successfully.',
    });
  } catch (error: any) {
    console.error('Error updating guide details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update guide details.' },
      { status: 500 }
    );
  }
}
