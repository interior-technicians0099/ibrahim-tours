import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getScopedOperatorId } from '@/lib/auth-helpers';
import { toOperatorBookingDto } from '@/lib/serialization';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * P1 — Operator bookings feed. Returns ONLY bookings forwarded to the
 * operator (≥1 OperatorInbox message), scoped to their operatorId,
 * serialized via toOperatorBookingDto — zero financial data.
 */
export async function GET() {
  try {
    const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
    const scopedOperatorId = await getScopedOperatorId();

    const whereClause: any =
      user.role === Role.OPERATOR && scopedOperatorId
        ? { operatorId: scopedOperatorId }
        : {};

    const bookings = await prisma.booking.findMany({
      where: {
        ...whereClause,
        inboxMessages: { some: {} },
      },
      include: {
        tour: { select: { title: true } },
        route: { select: { origin: true, destination: true } },
        inboxMessages: {
          orderBy: { sentAt: 'desc' },
          select: { id: true, sentAt: true, readAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    return NextResponse.json({
      success: true,
      bookings: bookings.map(toOperatorBookingDto),
    });
  } catch (error: any) {
    console.error('Error loading operator bookings:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load bookings.' },
      { status: error?.message?.includes('403') ? 403 : 500 }
    );
  }
}
