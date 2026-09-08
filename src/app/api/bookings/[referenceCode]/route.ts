import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toPublicBookingDto } from '@/lib/serialization';

/**
 * GET /api/bookings/[referenceCode]
 * Public booking lookup by reference code.
 * Guaranteed to pass through toPublicBookingDto to strictly strip internal costs,
 * margins, and platform commission fields.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ referenceCode: string }> }
) {
  try {
    const { referenceCode } = await context.params;

    if (!referenceCode) {
      return NextResponse.json({ error: 'Booking reference code required.' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { referenceCode },
      include: {
        tour: true,
        transportService: true,
        route: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    // Sanitize with serialization layer: NEVER expose internal financials
    const publicDto = toPublicBookingDto(booking);

    return NextResponse.json({
      success: true,
      booking: publicDto,
    });
  } catch (error: any) {
    console.error('Error fetching public booking details:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve booking information.' },
      { status: 500 }
    );
  }
}
