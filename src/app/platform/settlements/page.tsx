import React from 'react';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role, BookingStatus, PaymentStatus } from '@prisma/client';
import SettlementsClient, {
  SettlementItem,
  ContributingBookingItem,
} from '@/components/platform/SettlementsClient';

export default async function PlatformSettlementsPage() {
  await requireRole(Role.PLATFORM_ADMIN);

  // 1. Fetch all monthly settlements
  const rawSettlements = await prisma.monthlySettlement.findMany({
    include: {
      operator: true,
    },
    orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
  });

  const formattedSettlements: SettlementItem[] = rawSettlements.map((s: any) => ({
    id: s.id,
    operatorId: s.operatorId,
    operatorName: s.operator?.name || s.operator?.businessName || 'Operator',
    month: s.month,
    totalBookings: s.totalBookings,
    totalRevenueCents: Number(s.totalRevenueCents),
    totalProfitCents: Number(s.totalProfitCents),
    commissionRate: s.commissionRate ? Number(s.commissionRate) * 100 : null,
    commissionDueCents: Number(s.commissionDueCents),
    status: s.status,
    settledAt: s.settledAt ? s.settledAt.toISOString() : null,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
  }));

  // 2. Fetch completed bookings for drill-down breakdown
  const rawCompleted = await prisma.booking.findMany({
    where: {
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID_IN_FULL,
    },
    include: {
      tour: true,
      transportService: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const contributingBookings: ContributingBookingItem[] = rawCompleted.map((b) => ({
    id: b.id,
    operatorId: b.operatorId,
    month: b.bookingDate ? new Date(b.bookingDate).toISOString().slice(0, 7) : b.createdAt.toISOString().slice(0, 7),
    referenceCode: b.referenceCode,
    serviceTitle:
      b.serviceType === 'TOUR'
        ? b.tour?.title || 'Zanzibar Tour'
        : `${b.pickupLocation || 'Pickup'} → ${b.dropoffLocation || 'Drop-off'}`,
    customerName: b.customerName,
    bookingDate: new Date(b.bookingDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    amountPaidCents: b.amountPaidCents || 0,
    profitCents: b.profitCents || Math.max(0, (b.amountPaidCents || 0) - (b.costCents || 0)),
    commissionAmountCents: b.commissionAmountCents || null,
  }));

  return (
    <SettlementsClient
      initialSettlements={formattedSettlements}
      allBookings={contributingBookings}
    />
  );
}
