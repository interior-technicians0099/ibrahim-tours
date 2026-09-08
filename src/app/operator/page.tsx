import React from 'react';
import { requireRole, getScopedOperatorId } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import OperatorDashboardClient, { OperatorBookingItem } from '@/components/operator/OperatorDashboardClient';

export default async function OperatorDashboardPage() {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
  const scopedOperatorId = await getScopedOperatorId();

  // Look up Operator profile
  const operator = scopedOperatorId
    ? await prisma.operatorProfile.findUnique({ where: { id: scopedOperatorId } })
    : await prisma.operatorProfile.findFirst();

  const operatorName = operator?.businessName || operator?.name || user.name || 'Ibrahim Tours';
  const effectiveOperatorId = operator?.id || 'operator-ibrahim';

  // Fetch scoped bookings with payments relation
  const rawBookings = await prisma.booking.findMany({
    where: user.role === Role.OPERATOR && scopedOperatorId ? { operatorId: scopedOperatorId } : {},
    include: {
      tour: true,
      transportService: true,
      route: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        include: {
          recordedBy: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formattedBookings: OperatorBookingItem[] = rawBookings.map((b) => ({
    id: b.id,
    referenceCode: b.referenceCode,
    serviceType: b.serviceType,
    tier: b.tier || null,
    serviceTitle:
      b.serviceType === 'TOUR'
        ? b.tour?.title || 'Zanzibar Island Tour'
        : `${b.pickupLocation || 'Pickup'} → ${b.dropoffLocation || 'Drop-off'}`,
    customerName: b.customerName,
    customerEmail: b.customerEmail,
    customerPhone: b.customerPhone,
    customerCountry: b.customerCountry || null,
    bookingDate: new Date(b.bookingDate).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    rawBookingDate: b.bookingDate.toISOString(),
    bookingTime: b.bookingTime || null,
    numAdults: b.numAdults,
    numChildren: b.numChildren,
    pickupLocation: b.pickupLocation || null,
    dropoffLocation: b.dropoffLocation || null,
    specialRequests: b.specialRequests || null,
    status: b.status,
    paymentStatus: b.paymentStatus,
    amountPaidCents: b.amountPaidCents || 0,
    totalPriceCents: b.totalPriceCents || 0,
    quotedPriceCents: b.quotedPriceCents || b.totalPriceCents || 0,
    costCents: b.costCents || null,
    profitCents: b.profitCents || null,
    commissionRate: b.commissionRate ? Number(b.commissionRate) * 100 : null,
    commissionAmountCents: b.commissionAmountCents || null,
    paymentMethod: (b.paymentMethod as any) || null,
    paymentReference: b.paymentReference || null,
    operatorNotes: b.operatorNotes || null,
    cancellationReason: b.cancellationReason || null,
    createdAt: b.createdAt.toISOString(),
    payments: b.payments.map((p) => ({
      id: p.id,
      amountPaidCents: p.amountPaidCents,
      paymentMethod: p.paymentMethod,
      paymentDate: new Date(p.paymentDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      paymentReference: p.paymentReference || null,
      notes: p.notes || null,
      recordedByName: p.recordedBy?.name || null,
      createdAt: p.createdAt.toISOString(),
    })),
  }));

  return (
    <OperatorDashboardClient
      initialBookings={formattedBookings}
      operatorName={operatorName}
      operatorId={effectiveOperatorId}
    />
  );
}
