import { BookingStatus, PaymentStatus } from '@prisma/client';

/**
 * Enforces the critical business invariant gate:
 * A booking can NEVER have status = CONFIRMED unless paymentStatus = PAID_IN_FULL.
 * Throws an error if the invariant is violated.
 */
export function assertConfirmationAllowed(
  targetStatus: BookingStatus,
  currentOrNewPaymentStatus: PaymentStatus
): void {
  if (
    targetStatus === BookingStatus.CONFIRMED &&
    currentOrNewPaymentStatus !== PaymentStatus.PAID_IN_FULL
  ) {
    throw new Error(
      `Violation of Booking Invariant: A booking cannot be CONFIRMED until paymentStatus is PAID_IN_FULL. Current payment status is "${currentOrNewPaymentStatus}". Please record full payment before confirming.`
    );
  }
}

/**
 * Validates manual operator status transitions:
 * 1. CONFIRMED cannot be manually selected — it is triggered ONLY by recording full payment.
 * 2. COMPLETED is allowed ONLY on CONFIRMED bookings with PAID_IN_FULL.
 * 3. REJECTED or CANCELLED requires a mandatory reason (minimum 5 characters).
 */
export function assertManualStatusTransitionAllowed(
  currentStatus: BookingStatus,
  targetStatus: BookingStatus,
  currentPaymentStatus: PaymentStatus,
  reason?: string | null
): void {
  // 1. CONFIRMED is NOT manually selectable
  if (targetStatus === BookingStatus.CONFIRMED) {
    throw new Error(
      'Manual confirmation is not permitted. Bookings are automatically CONFIRMED only upon recording full payment (PAID_IN_FULL).'
    );
  }

  // 2. COMPLETED requires CONFIRMED + PAID_IN_FULL
  if (targetStatus === BookingStatus.COMPLETED) {
    if (currentStatus !== BookingStatus.CONFIRMED) {
      throw new Error(
        `Cannot complete booking: Booking must be in CONFIRMED status (currently ${currentStatus}).`
      );
    }
    if (currentPaymentStatus !== PaymentStatus.PAID_IN_FULL) {
      throw new Error(
        `Cannot complete booking: Booking must be PAID_IN_FULL (currently ${currentPaymentStatus}).`
      );
    }
  }

  // 3. REJECTED or CANCELLED requires a reason
  if (targetStatus === BookingStatus.REJECTED || targetStatus === BookingStatus.CANCELLED) {
    if (!reason || reason.trim().length < 5) {
      throw new Error(
        'A mandatory reason (minimum 5 characters) is required when rejecting or cancelling a booking.'
      );
    }
  }
}
