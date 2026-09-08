import { prisma } from '@/lib/prisma';
import {
  BookingStatus,
  PaymentStatus,
  SettlementStatus,
  CommissionStatus,
  Prisma,
} from '@prisma/client';
import {
  resolveEffectiveCommissionRate,
  calculateCommission,
} from '@/lib/commission';
import { sendSettlementStatementNotification } from '@/lib/services/email-service';

export interface SettlementSummary {
  id?: string;
  operatorId: string;
  operatorName: string;
  month: string;
  totalBookings: number;
  totalRevenueCents: number;
  totalProfitCents: number;
  commissionRate: number | null;
  commissionDueCents: number;
  status: SettlementStatus;
  isPendingRate: boolean;
  missingCostCount: number;
  notes?: string | null;
}

/**
 * Calculates start and end Date objects in UTC for a calendar month "YYYY-MM".
 * Example: "2026-09" -> 2026-09-01T00:00:00.000Z to 2026-10-01T00:00:00.000Z
 */
export function getMonthDateRange(monthStr: string): { startDate: Date; endDate: Date } {
  const [yearStr, monthNumStr] = (monthStr || '').split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthNumStr, 10) - 1;

  if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    throw new Error(
      `Invalid month format "${monthStr}". Expected format "YYYY-MM" (e.g. "2026-09").`
    );
  }

  const startDate = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));

  return { startDate, endDate };
}

/**
 * Aggregates all CONFIRMED + COMPLETED + PAID_IN_FULL bookings for an operator in a specific month
 * and upserts a MonthlySettlement row (status: PENDING).
 *
 * SERVICE DATE BUCKETING RATIONALE:
 * Bookings are bucketed strictly by `bookingDate` (the service delivery date) rather than
 * request creation date (`createdAt`) or deposit payment date (`paymentDate`). Operating
 * expenditures (fuel, park fees, vehicle depreciation, tour guide wages) are incurred on
 * the day the excursion takes place. Aligning settlements with `bookingDate` ensures
 * accurate matching of monthly revenue against real operating expenses and commission dues.
 */
export async function runMonthlySettlementForOperator(
  operatorId: string,
  month: string,
  adminUserId?: string
): Promise<SettlementSummary> {
  const { startDate, endDate } = getMonthDateRange(month);

  const operator = await prisma.operatorProfile.findUnique({
    where: { id: operatorId },
  });

  if (!operator) {
    throw new Error(`Operator ${operatorId} not found.`);
  }

  // 1. Fetch completed & fully-paid bookings whose bookingDate (service date) falls in target month
  // Excludes CANCELLED, REJECTED, and uncompleted requests
  const completedBookings = await prisma.booking.findMany({
    where: {
      operatorId,
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID_IN_FULL,
      bookingDate: {
        gte: startDate,
        lt: endDate,
      },
    },
  });

  // 2. Separate bookings with valid cost vs missing cost
  const validBookings: typeof completedBookings = [];
  let missingCostCount = 0;

  for (const b of completedBookings) {
    if (b.costCents === null || b.costCents === undefined) {
      missingCostCount++;
      // Ensure flagged in database as MISSING_COST
      if (b.commissionStatus !== CommissionStatus.MISSING_COST) {
        await prisma.booking.update({
          where: { id: b.id },
          data: { commissionStatus: CommissionStatus.MISSING_COST },
        });
      }
    } else {
      validBookings.push(b);
    }
  }

  // 3. Resolve Effective Commission Rate for the operator
  const effectiveRate = await resolveEffectiveCommissionRate(operatorId);
  const isPendingRate = effectiveRate === null;

  // 4. Calculate totals and handle PENDING_RATE bookings
  let totalRevenueCents = 0;
  let totalProfitCents = 0;
  let commissionDueCents = 0;

  for (const b of validBookings) {
    const revenue = b.amountPaidCents || b.totalPriceCents || 0;
    const cost = b.costCents || 0;
    const profit = Math.max(0, revenue - cost);

    totalRevenueCents += revenue;
    totalProfitCents += profit;

    // Check if rate needs to be applied at settlement time
    let bookingCommission = b.commissionAmountCents;

    if (
      (b.commissionStatus === CommissionStatus.PENDING_RATE || b.commissionRate === null) &&
      !isPendingRate
    ) {
      // Apply current rate at settlement time
      const computed = calculateCommission(revenue, cost, effectiveRate);
      bookingCommission = computed.commissionAmountCents;

      // Update booking and mark as RATE_APPLIED_LATE
      await prisma.booking.update({
        where: { id: b.id },
        data: {
          profitCents: computed.profitCents,
          commissionRate: new Prisma.Decimal((effectiveRate / 100).toFixed(4)),
          commissionAmountCents: bookingCommission,
          commissionStatus: CommissionStatus.RATE_APPLIED_LATE,
        },
      });
    }

    commissionDueCents += bookingCommission || 0;
  }

  const totalBookings = validBookings.length;

  let notes = isPendingRate
    ? 'Settlement calculated with pending platform commission rate (TBD).'
    : `Standard platform commission applied at ${effectiveRate}%.`;

  if (missingCostCount > 0) {
    notes += ` [Warning: ${missingCostCount} completed booking(s) excluded due to missing cost].`;
  }

  const rateDecimal = !isPendingRate
    ? (effectiveRate / 100).toFixed(4)
    : (0).toFixed(4);

  // 5. Upsert MonthlySettlement (Preserve existing SETTLED or PAID status if already agreed/paid)
  const existingSettlement = await prisma.monthlySettlement.findUnique({
    where: {
      operatorId_month: {
        operatorId,
        month,
      },
    },
  });

  const initialStatus = existingSettlement
    ? existingSettlement.status
    : SettlementStatus.PENDING;

  const settlement = await prisma.monthlySettlement.upsert({
    where: {
      operatorId_month: {
        operatorId,
        month,
      },
    },
    update: {
      totalBookings,
      totalRevenueCents: BigInt(totalRevenueCents),
      totalProfitCents: BigInt(totalProfitCents),
      commissionRate: rateDecimal,
      commissionDueCents: BigInt(commissionDueCents),
      notes,
    },
    create: {
      operatorId,
      month,
      totalBookings,
      totalRevenueCents: BigInt(totalRevenueCents),
      totalProfitCents: BigInt(totalProfitCents),
      commissionRate: rateDecimal,
      commissionDueCents: BigInt(commissionDueCents),
      status: initialStatus,
      notes,
    },
  });

  // 6. Record to AuditLog (safely checking if adminUserId exists)
  let validUserId: string | null = null;
  if (adminUserId) {
    const userExists = await prisma.adminUser.findUnique({
      where: { id: adminUserId },
      select: { id: true },
    });
    if (userExists) {
      validUserId = userExists.id;
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: validUserId,
      action: 'GENERATE_MONTHLY_SETTLEMENT',
      entityType: 'MonthlySettlement',
      entityId: settlement.id,
      details: {
        triggeredBy: adminUserId || 'system-cron',
        operatorId,
        operatorName: operator.name,
        month,
        totalBookings,
        totalRevenueCents,
        totalProfitCents,
        effectiveRate,
        commissionDueCents,
        missingCostCount,
        isPendingRate,
      },
    },
  });

  const summary: SettlementSummary = {
    id: settlement.id,
    operatorId,
    operatorName: operator.name || operator.businessName,
    month,
    totalBookings,
    totalRevenueCents,
    totalProfitCents,
    commissionRate: effectiveRate,
    commissionDueCents,
    status: settlement.status,
    isPendingRate,
    missingCostCount,
    notes,
  };

  // 7. Fire transactional notifications asynchronously
  sendSettlementStatementNotification({
    id: settlement.id,
    operatorId,
    operatorName: operator.name || operator.businessName,
    operatorEmail: operator.email,
    month,
    totalBookings,
    totalRevenueFormatted: `$${(totalRevenueCents / 100).toFixed(2)}`,
    totalProfitFormatted: `$${(totalProfitCents / 100).toFixed(2)}`,
    commissionRateFormatted: effectiveRate !== null ? `${effectiveRate}%` : 'Pending Rate (TBD)',
    commissionDueFormatted: `$${(commissionDueCents / 100).toFixed(2)}`,
    missingCostCount,
    status: settlement.status,
    notes,
  }).catch((err) => console.warn('Failed to send statement notification:', err));

  return summary;
}

/**
 * Runs monthly settlements for all active operators.
 */
export async function runAllMonthlySettlements(
  month: string,
  adminUserId?: string
): Promise<SettlementSummary[]> {
  const operators = await prisma.operatorProfile.findMany();
  const results: SettlementSummary[] = [];

  for (const op of operators) {
    const summary = await runMonthlySettlementForOperator(op.id, month, adminUserId);
    results.push(summary);
  }

  return results;
}

/**
 * Validates and updates a settlement's status:
 * Lifecycle Sequence: PENDING -> SETTLED -> PAID
 */
export async function updateSettlementStatus(
  settlementId: string,
  targetStatus: SettlementStatus,
  adminUserId: string,
  notes?: string
) {
  const settlement = await prisma.monthlySettlement.findUnique({
    where: { id: settlementId },
    include: { operator: true },
  });

  if (!settlement) {
    throw new Error(`MonthlySettlement ${settlementId} not found.`);
  }

  // Enforce workflow lifecycle:
  // PENDING can transition to SETTLED or PAID
  // SETTLED can transition to PAID or back to PENDING (if disputed)
  // PAID can revert to SETTLED if ledger adjustment required
  const allowedTransitions: Record<SettlementStatus, SettlementStatus[]> = {
    [SettlementStatus.PENDING]: [SettlementStatus.SETTLED, SettlementStatus.PAID],
    [SettlementStatus.SETTLED]: [SettlementStatus.PAID, SettlementStatus.PENDING],
    [SettlementStatus.PAID]: [SettlementStatus.SETTLED],
  };

  if (!allowedTransitions[settlement.status]?.includes(targetStatus)) {
    throw new Error(
      `Cannot transition settlement from ${settlement.status} to ${targetStatus}.`
    );
  }

  const settledAt =
    targetStatus === SettlementStatus.PAID || targetStatus === SettlementStatus.SETTLED
      ? (settlement.settledAt || new Date())
      : null;

  const updated = await prisma.monthlySettlement.update({
    where: { id: settlementId },
    data: {
      status: targetStatus,
      settledAt,
      notes: notes !== undefined ? notes : settlement.notes,
    },
  });

  // Write to AuditLog
  let validUserId: string | null = null;
  if (adminUserId) {
    const userExists = await prisma.adminUser.findUnique({
      where: { id: adminUserId },
      select: { id: true },
    });
    if (userExists) {
      validUserId = userExists.id;
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: validUserId,
      action: 'UPDATE_SETTLEMENT_STATUS',
      entityType: 'MonthlySettlement',
      entityId: settlement.id,
      details: {
        operatorId: settlement.operatorId,
        month: settlement.month,
        previousStatus: settlement.status,
        newStatus: targetStatus,
        commissionDueCents: Number(settlement.commissionDueCents),
        notes,
      },
    },
  });

  return updated;
}
