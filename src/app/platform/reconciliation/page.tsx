import React from 'react';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role, BookingStatus, PaymentStatus, CommissionStatus } from '@prisma/client';
import PlatformReconciliationClient, {
  ReconciliationItem,
} from '@/components/platform/PlatformReconciliationClient';

export default async function PlatformReconciliationPage() {
  const user = await requireRole(Role.PLATFORM_ADMIN);

  // Fetch all active bookings
  const bookings = await prisma.booking.findMany({
    where: {
      status: { notIn: [BookingStatus.CANCELLED, BookingStatus.REJECTED] },
    },
    include: {
      tour: true,
      route: true,
      operator: true,
      payments: { orderBy: { paymentDate: 'desc' } },
    },
    orderBy: { bookingDate: 'desc' },
  });

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const reconciliationItems: ReconciliationItem[] = [];

  for (const b of bookings) {
    const quotedPriceCents = b.quotedPriceCents || b.totalPriceCents || 0;
    const amountPaidCents = b.amountPaidCents || 0;
    const serviceDate = new Date(b.bookingDate);

    const anomalies: string[] = [];
    let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

    // Anomaly 1: COMPLETED but NOT_PAID or PARTIALLY_PAID
    if (b.status === BookingStatus.COMPLETED && b.paymentStatus !== PaymentStatus.PAID_IN_FULL) {
      anomalies.push(`Tour completed but payment status is ${b.paymentStatus} ($${(amountPaidCents / 100).toFixed(2)} paid of $${(quotedPriceCents / 100).toFixed(2)})`);
      severity = 'HIGH';
    }

    // Anomaly 2: amountPaid != quotedPrice on confirmed/completed bookings
    if (
      (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED) &&
      amountPaidCents !== quotedPriceCents
    ) {
      if (amountPaidCents < quotedPriceCents) {
        anomalies.push(`Underpaid by $${((quotedPriceCents - amountPaidCents) / 100).toFixed(2)}`);
        if (severity !== 'HIGH') severity = 'MEDIUM';
      } else {
        anomalies.push(`Overpaid by $${((amountPaidCents - quotedPriceCents) / 100).toFixed(2)}`);
        if (severity !== 'HIGH') severity = 'LOW';
      }
    }

    // Anomaly 3: Payment recorded, but booking not COMPLETED after 7 days since excursion date
    if (
      b.paymentStatus === PaymentStatus.PAID_IN_FULL &&
      b.status !== BookingStatus.COMPLETED &&
      serviceDate < sevenDaysAgo
    ) {
      const daysOverdue = Math.floor((now.getTime() - serviceDate.getTime()) / (1000 * 60 * 60 * 24));
      anomalies.push(`Excursion occurred ${daysOverdue} days ago but booking remains uncompleted`);
      severity = 'HIGH';
    }

    // Anomaly 4: costCents == null on CONFIRMED or COMPLETED bookings (MISSING_COST)
    if (
      (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED) &&
      (b.costCents === null || b.commissionStatus === CommissionStatus.MISSING_COST)
    ) {
      anomalies.push('Operating cost (costCents) is missing — excluded from settlements');
      if (severity !== 'HIGH') severity = 'MEDIUM';
    }

    if (anomalies.length > 0) {
      reconciliationItems.push({
        id: b.id,
        referenceCode: b.referenceCode,
        serviceTitle:
          b.serviceType === 'TOUR'
            ? b.tour?.title || 'Tour Excursion'
            : `${b.pickupLocation || 'Pickup'} → ${b.dropoffLocation || 'Drop-off'}`,
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        customerPhone: b.customerPhone,
        operatorName: b.operator?.name || b.operator?.businessName || 'Ibrahim Tours',
        bookingDate: b.bookingDate.toISOString().slice(0, 10),
        status: b.status,
        paymentStatus: b.paymentStatus,
        quotedPriceCents,
        amountPaidCents,
        costCents: b.costCents,
        profitCents: b.profitCents,
        anomalies,
        severity,
      });
    }
  }

  return (
    <PlatformReconciliationClient
      initialItems={reconciliationItems}
      adminName={user.name}
      adminEmail={user.email}
    />
  );
}
