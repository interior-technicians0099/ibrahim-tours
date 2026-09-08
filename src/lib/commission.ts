import { prisma } from '@/lib/prisma';
import { CommissionStatus, Prisma } from '@prisma/client';

export interface CommissionCalculationResult {
  profitCents: number | null;
  commissionRate: number | null;
  commissionAmountCents: number | null;
  status: CommissionStatus;
}

/**
 * Pure calculation function for platform commission on a booking:
 * - If costCents is NULL or undefined -> MISSING_COST (excluded from settlements)
 * - If commissionRate is NULL -> PENDING_RATE (profit computed, rate TBD)
 * - If both present -> CALCULATED (profit = amountPaid - cost, commission = round(profit * rate / 100))
 */
export function calculateCommission(
  amountPaidCents: number,
  costCents: number | null | undefined,
  commissionRate: number | null | undefined
): CommissionCalculationResult {
  // 1. Missing Cost Check
  if (costCents === null || costCents === undefined || isNaN(Number(costCents))) {
    return {
      profitCents: null,
      commissionRate: null,
      commissionAmountCents: null,
      status: CommissionStatus.MISSING_COST,
    };
  }

  const validCost = Math.max(0, Number(costCents));
  const profitCents = Math.max(0, amountPaidCents - validCost);

  // 2. Pending Rate Check
  if (
    commissionRate === null ||
    commissionRate === undefined ||
    isNaN(Number(commissionRate))
  ) {
    return {
      profitCents,
      commissionRate: null,
      commissionAmountCents: null,
      status: CommissionStatus.PENDING_RATE,
    };
  }

  const validRate = Number(commissionRate);
  // Normalize if provided as a decimal fraction (e.g., 0.15 for 15%)
  const normalizedRate = validRate > 0 && validRate <= 1 ? Number((validRate * 100).toFixed(2)) : validRate;
  const commissionAmountCents = Math.round((profitCents * normalizedRate) / 100);

  return {
    profitCents,
    commissionRate: normalizedRate,
    commissionAmountCents,
    status: CommissionStatus.CALCULATED,
  };
}

/**
 * Retrieves the global platform commission rate from Settings.
 * Key: "commission_rate"
 * Value can be stored as { rate: number | null } or a numeric percentage.
 * Returns null if unset or explicitly TBD.
 */
export async function getGlobalCommissionRate(): Promise<number | null> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'commission_rate' },
    });

    if (!setting || setting.value === null || setting.value === undefined) {
      return null;
    }

    const val: any = setting.value;
    const rawRate =
      typeof val === 'object' && val !== null && 'rate' in val ? val.rate : val;

    if (rawRate === null || rawRate === undefined || rawRate === '') {
      return null;
    }

    const num = Number(rawRate);
    if (isNaN(num) || num < 0) return null;

    // Normalization: if stored as decimal fractional (e.g. 0.15), convert to percentage 15%
    return num <= 1 && num > 0 ? Number((num * 100).toFixed(2)) : Number(num.toFixed(2));
  } catch (err) {
    console.error('Error fetching global commission_rate:', err);
    return null;
  }
}

/**
 * Resolves the effective commission rate for a booking:
 * 1. Operator-specific commissionRate override (from OperatorProfile)
 * 2. Global commission_rate from Settings
 * 3. Fallback to null (TBD / pending rate)
 */
export async function resolveEffectiveCommissionRate(
  operatorId?: string | null
): Promise<number | null> {
  if (operatorId) {
    try {
      const operator = await prisma.operatorProfile.findUnique({
        where: { id: operatorId },
        select: { commissionRate: true },
      });

      if (
        operator &&
        operator.commissionRate !== null &&
        operator.commissionRate !== undefined
      ) {
        const num = Number(operator.commissionRate);
        if (!isNaN(num) && num > 0) {
          return num <= 1 ? Number((num * 100).toFixed(2)) : Number(num.toFixed(2));
        }
      }
    } catch (err) {
      console.error('Error fetching operator commission rate:', err);
    }
  }

  return await getGlobalCommissionRate();
}

/**
 * Computes and snapshots commission on a booking when reaching COMPLETED,
 * or during on-demand recalculation.
 */
export async function computeAndSnapshotBookingCommission(
  bookingId: string,
  customRate?: number | null
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      operatorId: true,
      amountPaidCents: true,
      totalPriceCents: true,
      costCents: true,
      status: true,
    },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found.`);
  }

  const effectiveRate =
    customRate !== undefined
      ? customRate
      : await resolveEffectiveCommissionRate(booking.operatorId);

  const amountPaidCents = booking.amountPaidCents || booking.totalPriceCents || 0;

  const { profitCents, commissionRate, commissionAmountCents, status } =
    calculateCommission(amountPaidCents, booking.costCents, effectiveRate);

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      profitCents,
      commissionRate:
        commissionRate !== null
          ? new Prisma.Decimal((commissionRate / 100).toFixed(4))
          : null,
      commissionAmountCents,
      commissionStatus: status,
    },
  });

  return {
    booking: updatedBooking,
    profitCents,
    commissionRate,
    commissionAmountCents,
    status,
  };
}

/**
 * Recalculates commissions for unsettled bookings where rate was pending or missing.
 * Excludes bookings associated with SETTLED or PAID MonthlySettlements.
 */
export async function recalculateUnsettledCommissions(options?: {
  operatorId?: string;
  rate?: number;
}) {
  const globalRate =
    options?.rate !== undefined ? options.rate : await getGlobalCommissionRate();

  if (globalRate === null) {
    return {
      success: false,
      message: 'Cannot recalculate unsettled commissions: No commission rate is configured in Settings.',
      recalculatedCount: 0,
      bookings: [],
    };
  }

  // Find all unsettled settlements (SETTLED or PAID) to exclude their booking months
  const finalizedSettlements = await prisma.monthlySettlement.findMany({
    where: {
      status: { in: ['SETTLED', 'PAID'] },
      ...(options?.operatorId ? { operatorId: options.operatorId } : {}),
    },
    select: { operatorId: true, month: true },
  });

  // Fetch completed, paid bookings with PENDING_RATE or null commissionRate, having costCents set
  const candidates = await prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      paymentStatus: 'PAID_IN_FULL',
      costCents: { not: null },
      OR: [
        { commissionStatus: CommissionStatus.PENDING_RATE },
        { commissionRate: null },
      ],
      ...(options?.operatorId ? { operatorId: options.operatorId } : {}),
    },
  });

  // Filter out any bookings belonging to a finalized settlement month
  const eligibleBookings = candidates.filter((b) => {
    const serviceMonth = b.bookingDate.toISOString().slice(0, 7);
    const isFinalized = finalizedSettlements.some(
      (s) => s.operatorId === b.operatorId && s.month === serviceMonth
    );
    return !isFinalized;
  });

  const updatedBookings = [];

  for (const b of eligibleBookings) {
    const operatorRate = await resolveEffectiveCommissionRate(b.operatorId);
    const rateToUse = operatorRate !== null ? operatorRate : globalRate;

    const amountPaid = b.amountPaidCents || b.totalPriceCents || 0;
    const { profitCents, commissionRate, commissionAmountCents } = calculateCommission(
      amountPaid,
      b.costCents,
      rateToUse
    );

    const updated = await prisma.booking.update({
      where: { id: b.id },
      data: {
        profitCents,
        commissionRate:
          commissionRate !== null
            ? new Prisma.Decimal((commissionRate / 100).toFixed(4))
            : null,
        commissionAmountCents,
        commissionStatus: CommissionStatus.CALCULATED,
      },
    });

    updatedBookings.push(updated);
  }

  return {
    success: true,
    message: `Successfully recalculated commission for ${updatedBookings.length} unsettled bookings at ${globalRate}%.`,
    recalculatedCount: updatedBookings.length,
    bookings: updatedBookings.map((b) => ({
      id: b.id,
      referenceCode: b.referenceCode,
      profitCents: b.profitCents,
      commissionRate: Number(b.commissionRate) * 100,
      commissionAmountCents: b.commissionAmountCents,
      status: b.commissionStatus,
    })),
  };
}
