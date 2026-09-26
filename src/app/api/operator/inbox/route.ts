import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getScopedOperatorId } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * P1 — Operator inbox feed. Assignment messages only (no financials);
 * booking payload is the service-details subset.
 */
export async function GET() {
  try {
    const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
    const scopedOperatorId = await getScopedOperatorId();

    const bookingScope: any =
      user.role === Role.OPERATOR && scopedOperatorId
        ? { operatorId: scopedOperatorId }
        : {};

    const messages = await prisma.operatorInbox.findMany({
      where: { booking: { ...bookingScope } },
      include: {
        booking: {
          select: {
            id: true,
            referenceCode: true,
            serviceType: true,
            bookingDate: true,
            bookingTime: true,
            status: true,
            customerName: true,
            pickupLocation: true,
            dropoffLocation: true,
            tour: { select: { title: true } },
            route: { select: { origin: true, destination: true } },
          },
        },
        sentBy: { select: { name: true, email: true } },
      },
      orderBy: { sentAt: 'desc' },
      take: 200,
    });

    const unreadCount = messages.filter((m) => !m.readAt).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      messages: messages.map((m) => ({
        id: m.id,
        bookingId: m.bookingId,
        message: m.message,
        sentAt: m.sentAt.toISOString(),
        readAt: m.readAt ? m.readAt.toISOString() : null,
        sentByName: m.sentBy?.name || m.sentBy?.email || 'Super admin',
        booking: m.booking
          ? {
              id: m.booking.id,
              referenceCode: m.booking.referenceCode,
              serviceType: m.booking.serviceType,
              serviceTitle:
                m.booking.serviceType === 'TOUR'
                  ? m.booking.tour?.title || 'Zanzibar Tour'
                  : `${m.booking.pickupLocation || 'Pickup'} → ${m.booking.dropoffLocation || 'Drop-off'}`,
              bookingDate: m.booking.bookingDate.toISOString(),
              bookingTime: m.booking.bookingTime,
              status: m.booking.status,
              customerName: m.booking.customerName,
            }
          : null,
      })),
    });
  } catch (error: any) {
    console.error('Error loading operator inbox:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load inbox.' },
      { status: error?.message?.includes('403') ? 403 : 500 }
    );
  }
}
