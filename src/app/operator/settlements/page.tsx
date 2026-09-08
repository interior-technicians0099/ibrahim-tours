import React from 'react';
import { requireRole, getScopedOperatorId } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role, BookingStatus, PaymentStatus } from '@prisma/client';
import OperatorSettlementsClient, {
  OperatorSettlementItem,
  OperatorContributingBooking,
} from '@/components/operator/OperatorSettlementsClient';

export default async function OperatorSettlementsPage() {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
  const scopedOperatorId = await getScopedOperatorId();

  // Look up Operator profile
  const operator = scopedOperatorId
    ? await prisma.operatorProfile.findUnique({ where: { id: scopedOperatorId } })
    : await prisma.operatorProfile.findFirst();

  const operatorName = operator?.businessName || operator?.name || user.name || 'Ibrahim Tours';
  const effectiveOperatorId = operator?.id || 'operator-ibrahim';

  // 1. Fetch monthly settlements for this operator
  const rawSettlements = await prisma.monthlySettlement.findMany({
    where: { operatorId: effectiveOperatorId },
    orderBy: { month: 'desc' },
  });

  const formattedSettlements: OperatorSettlementItem[] = rawSettlements.map((s: any) => {
    const totalRev = Number(s.totalRevenueCents);
    const totalProf = Number(s.totalProfitCents);
    const commDue = Number(s.commissionDueCents);
    return {
      id: s.id,
      month: s.month,
      totalBookings: s.totalBookings,
      totalRevenueCents: totalRev,
      totalProfitCents: totalProf,
      commissionRate: s.commissionRate ? Number(s.commissionRate) * 100 : null,
      commissionDueCents: commDue,
      netPayoutCents: totalProf - commDue,
      status: s.status,
      settledAt: s.settledAt ? s.settledAt.toISOString() : null,
      notes: s.notes,
    };
  });

  // 2. Fetch contributing completed bookings for drilldown breakdown
  const rawCompleted = await prisma.booking.findMany({
    where: {
      operatorId: effectiveOperatorId,
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID_IN_FULL,
    },
    include: {
      tour: true,
      transportService: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const formattedBookings: OperatorContributingBooking[] = rawCompleted.map((b) => ({
    id: b.id,
    month: b.bookingDate
      ? new Date(b.bookingDate).toISOString().slice(0, 7)
      : b.createdAt.toISOString().slice(0, 7),
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
  }));

  return (
    <OperatorSettlementsClient
      initialSettlements={formattedSettlements}
      contributingBookings={formattedBookings}
      operatorName={operatorName}
    />
  );
}
