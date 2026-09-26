import React from 'react';
import type { Metadata } from 'next';
import { requireRole, getScopedOperatorId } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { toOperatorBookingDto } from '@/lib/serialization';
import OperatorPortalClient from '@/components/operator/OperatorPortalClient';

export const metadata: Metadata = {
  title: 'Operator Portal | Zansafari Horizon',
  description: 'Tour assignments inbox, forwarded bookings, and tour completion.',
  robots: { index: false, follow: false },
};

/**
 * P1 — Operator portal root. Inbox + forwarded bookings ONLY.
 * All rows are pre-serialized (toOperatorBookingDto): zero financial data
 * ever reaches this page.
 */
export default async function OperatorPortalPage() {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
  const scopedOperatorId = await getScopedOperatorId();

  const bookingScope: any =
    user.role === Role.OPERATOR && scopedOperatorId ? { operatorId: scopedOperatorId } : {};

  const [messages, bookings] = await Promise.all([
    prisma.operatorInbox.findMany({
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
          },
        },
        sentBy: { select: { name: true, email: true } },
      },
      orderBy: { sentAt: 'desc' },
      take: 200,
    }),
    prisma.booking.findMany({
      where: { ...bookingScope, inboxMessages: { some: {} } },
      include: {
        tour: { select: { title: true } },
        inboxMessages: {
          orderBy: { sentAt: 'desc' },
          select: { id: true, sentAt: true, readAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
  ]);

  return (
    <OperatorPortalClient
      operatorName={user.name || 'Operator'}
      initialMessages={JSON.parse(JSON.stringify(messages))}
      initialBookings={JSON.parse(JSON.stringify(bookings.map(toOperatorBookingDto)))}
    />
  );
}
