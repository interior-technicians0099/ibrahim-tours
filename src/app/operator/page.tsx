import React from 'react';
import { requireRole, getScopedOperatorId } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getCompanyProfile } from '@/lib/company';
import OperatorDashboardClient, {
  OperatorBookingItem,
} from '@/components/operator/OperatorDashboardClient';

export const metadata = {
  title: 'Operator Operations & Ledger | Zansafari Horizon',
  description: 'Manage bookings, verify tourists, record cash and M-Pesa payments.',
};

export default async function OperatorDashboardPage() {
  const user = await requireRole([Role.OPERATOR, Role.COMPANY_ADMIN, Role.PLATFORM_ADMIN]);
  const scopedOperatorId = await getScopedOperatorId();
  const company = await getCompanyProfile();

  // Fetch bookings scoped to this operator (or all if platform admin)
  const whereClause =
    (user.role === Role.OPERATOR || user.role === Role.COMPANY_ADMIN) && scopedOperatorId
      ? { operatorId: scopedOperatorId }
      : {};

  let rawBookings: any[] = [];
  try {
    rawBookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        tour: true,
        transportService: true,
        route: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: { recordedBy: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Failed to query bookings in /operator/page.tsx:', err);
  }

  const formattedBookings: OperatorBookingItem[] = rawBookings.map((b) => {
    return {
      id: b.id,
      referenceCode: b.referenceCode,
      serviceType: b.serviceType,
      tier: b.tier,
      serviceTitle:
        b.serviceType === 'TOUR'
          ? b.tour?.title || 'Tour Excursion'
          : `${b.pickupLocation || 'Pickup'} → ${b.dropoffLocation || 'Drop-off'}`,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      customerPhone: b.customerPhone,
      customerCountry: b.customerCountry || null,
      bookingDate: b.bookingDate ? b.bookingDate.toISOString().slice(0, 10) : '',
      rawBookingDate: b.bookingDate ? b.bookingDate.toISOString() : new Date().toISOString(),
      bookingTime: b.bookingTime || null,
      numAdults: b.numAdults || 1,
      numChildren: b.numChildren || 0,
      pickupLocation: b.pickupLocation || null,
      dropoffLocation: b.dropoffLocation || null,
      specialRequests: b.specialRequests || null,
      status: b.status,
      paymentStatus: b.paymentStatus,
      amountPaidCents: b.amountPaidCents ?? 0,
      totalPriceCents: b.totalPriceCents ?? 0,
      quotedPriceCents: b.quotedPriceCents ?? b.totalPriceCents ?? 0,
      costCents: b.costCents ?? null,
      profitCents: b.profitCents ?? null,
      commissionRate: b.commissionRate ? Number(b.commissionRate) : null,
      commissionAmountCents: b.commissionAmountCents ?? null,
      paymentMethod: b.paymentMethod ?? null,
      paymentReference: b.paymentReference ?? null,
      operatorNotes: b.operatorNotes ?? null,
      cancellationReason: b.cancellationReason ?? null,
      createdAt: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString(),
      payments: (b.payments || []).map((p: any) => ({
        id: p.id,
        amountPaidCents: p.amountPaidCents,
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate ? p.paymentDate.toISOString().slice(0, 10) : '',
        paymentReference: p.paymentReference,
        notes: p.notes,
        recordedByName: p.recordedBy?.name || p.recordedBy?.email || 'Operator',
        createdAt: p.createdAt ? p.createdAt.toISOString() : '',
      })),
    };
  });

  return (
    <OperatorDashboardClient
      initialBookings={formattedBookings}
      operatorName={company.companyName || 'Zansafari Horizon'}
      operatorId={company.id || 'operator-ibrahim'}
      userRole={user.role}
      userEmail={user.email}
    />
  );
}
