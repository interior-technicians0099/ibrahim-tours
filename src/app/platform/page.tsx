import React from 'react';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role, BookingStatus, PaymentStatus, SettlementStatus, CommissionStatus } from '@prisma/client';
import { getGlobalCommissionRate } from '@/lib/commission';
import { getMonthDateRange } from '@/lib/services/settlement-service';
import PlatformDashboardClient, {
  PlatformOverviewData,
} from '@/components/platform/PlatformDashboardClient';

export default async function PlatformDashboardPage() {
  const user = await requireRole(Role.PLATFORM_ADMIN);

  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7);
  const { startDate, endDate } = getMonthDateRange(currentMonthStr);

  // 1. Current Month Bookings & Economics (Service Date Bucketing)
  const currentMonthBookings = await prisma.booking.findMany({
    where: {
      bookingDate: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      id: true,
      amountPaidCents: true,
      totalPriceCents: true,
      profitCents: true,
      commissionAmountCents: true,
      status: true,
      paymentStatus: true,
    },
  });

  const bookingsThisMonth = currentMonthBookings.length;
  const revenueThisMonthCents = currentMonthBookings.reduce(
    (sum, b) => sum + (b.amountPaidCents || 0),
    0
  );
  const profitThisMonthCents = currentMonthBookings.reduce(
    (sum, b) => sum + (b.profitCents || 0),
    0
  );
  const commissionThisMonthCents = currentMonthBookings.reduce(
    (sum, b) => sum + (b.commissionAmountCents || 0),
    0
  );

  // 2. Pending Unsettled Commission Across All Past & Current PENDING Settlements
  const pendingSettlements = await prisma.monthlySettlement.findMany({
    where: { status: SettlementStatus.PENDING },
  });
  const pendingSettlementsDueCents = pendingSettlements.reduce(
    (sum, s) => sum + Number(s.commissionDueCents),
    0
  );

  // 3. Flags & Anomalies Counts
  const pendingRateCount = await prisma.booking.count({
    where: {
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID_IN_FULL,
      costCents: { not: null },
      OR: [
        { commissionStatus: CommissionStatus.PENDING_RATE },
        { commissionRate: null },
      ],
    },
  });

  const missingCostCount = await prisma.booking.count({
    where: {
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      costCents: null,
    },
  });

  const unpaidCompletedCount = await prisma.booking.count({
    where: {
      status: BookingStatus.COMPLETED,
      paymentStatus: { not: PaymentStatus.PAID_IN_FULL },
    },
  });

  const pendingSettlementsCount = pendingSettlements.length;

  // 4. Global Commission Rate
  const globalRate = await getGlobalCommissionRate();

  // 5. Recent Bookings Across All Operators (Newest 10)
  const rawRecentBookings = await prisma.booking.findMany({
    include: {
      tour: true,
      route: true,
      operator: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const recentBookings = rawRecentBookings.map((b) => ({
    id: b.id,
    referenceCode: b.referenceCode,
    serviceTitle:
      b.serviceType === 'TOUR'
        ? b.tour?.title || 'Tour Excursion'
        : `${b.pickupLocation || 'Pickup'} → ${b.dropoffLocation || 'Drop-off'}`,
    customerName: b.customerName,
    operatorName: b.operator?.name || b.operator?.businessName || 'Ibrahim Tours',
    bookingDate: new Date(b.bookingDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    status: b.status,
    paymentStatus: b.paymentStatus,
    amountPaidCents: b.amountPaidCents || 0,
    totalPriceCents: b.totalPriceCents || 0,
    profitCents: b.profitCents,
    commissionAmountCents: b.commissionAmountCents,
    commissionStatus: b.commissionStatus,
  }));

  const overviewData: PlatformOverviewData = {
    currentMonth: currentMonthStr,
    bookingsThisMonth,
    revenueThisMonthCents,
    profitThisMonthCents,
    commissionThisMonthCents,
    pendingSettlementsDueCents,
    pendingRateCount,
    missingCostCount,
    unpaidCompletedCount,
    pendingSettlementsCount,
    globalRate,
    recentBookings,
  };

  return (
    <PlatformDashboardClient
      adminName={user.name}
      adminEmail={user.email}
      data={overviewData}
    />
  );
}
