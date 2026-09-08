import React from 'react';
import { requireRole, getScopedOperatorId } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role, BookingStatus, PaymentStatus } from '@prisma/client';
import { getGlobalCommissionRate } from '@/lib/services/commission-service';
import CommissionReportsClient, {
  MonthlyReportRow,
} from '@/components/platform/CommissionReportsClient';

export default async function PlatformReportsPage() {
  const user = await requireRole([Role.PLATFORM_ADMIN, Role.OPERATOR]);
  const scopedOperatorId = await getScopedOperatorId();

  // 1. Fetch completed bookings
  const rawBookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID_IN_FULL,
      ...(user.role === Role.OPERATOR && scopedOperatorId
        ? { operatorId: scopedOperatorId }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Fetch monthly settlements to join settlement status
  const settlements = await prisma.monthlySettlement.findMany({
    where: {
      ...(user.role === Role.OPERATOR && scopedOperatorId
        ? { operatorId: scopedOperatorId }
        : {}),
    },
  });

  const settlementMap = new Map<string, any>();
  for (const s of settlements) {
    settlementMap.set(s.month, s);
  }

  const globalRate = await getGlobalCommissionRate();

  // 3. Group by month YYYY-MM
  const monthGroups = new Map<string, typeof rawBookings>();
  for (const b of rawBookings) {
    const dateObj = b.paymentDate || b.bookingDate;
    const month = dateObj ? new Date(dateObj).toISOString().slice(0, 7) : 'Unscheduled';
    if (!monthGroups.has(month)) {
      monthGroups.set(month, []);
    }
    monthGroups.get(month)!.push(b);
  }

  // If no completed bookings, at least provide current month
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (!monthGroups.has(currentMonth)) {
    monthGroups.set(currentMonth, []);
  }

  const sortedMonths = Array.from(monthGroups.keys()).sort().reverse();

  const reportRows: MonthlyReportRow[] = sortedMonths.map((month) => {
    const list = monthGroups.get(month) || [];
    const totalBookings = list.length;
    const revenueCents = list.reduce((sum, b) => sum + (b.amountPaidCents || 0), 0);
    const costCents = list.reduce((sum, b) => sum + (b.costCents || 0), 0);
    const profitCents = list.reduce(
      (sum, b) => sum + (b.profitCents || Math.max(0, (b.amountPaidCents || 0) - (b.costCents || 0))),
      0
    );

    const settlement = settlementMap.get(month);
    const effectiveRate = settlement?.commissionRate
      ? Number(settlement.commissionRate) * 100
      : globalRate;

    const isPendingRate = effectiveRate === null;
    const commissionDueCents = !isPendingRate
      ? Math.round((profitCents * effectiveRate) / 100)
      : 0;
    const operatorNetEarningsCents = profitCents - commissionDueCents;
    const settlementStatus = settlement?.status || 'PENDING';

  return {
      month,
      totalBookings,
      revenueCents,
      costCents,
      profitCents,
      commissionRate: effectiveRate,
      commissionDueCents,
      operatorNetEarningsCents,
      settlementStatus,
      isPendingRate,
    };
  });

  return <CommissionReportsClient reportRows={reportRows} userRole={user.role} />;
}
