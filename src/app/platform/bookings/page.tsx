import React from 'react';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getCompanyProfile } from '@/lib/company';
import PlatformBookingsMasterClient, {
  MasterBookingItem,
} from '@/components/platform/PlatformBookingsMasterClient';

export default async function PlatformBookingsMasterPage() {
  const user = await requireRole(Role.PLATFORM_ADMIN);
  const companyProfile = await getCompanyProfile();

  const rawBookings = await prisma.booking.findMany({
    include: {
      tour: true,
      route: true,
      operator: true,
      receipt: true,
      checkedInBy: { select: { name: true, email: true } },
      payments: {
        orderBy: { paymentDate: 'desc' },
        include: { recordedBy: { select: { name: true, email: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch audit logs for all bookings
  const bookingAuditLogs = await prisma.auditLog.findMany({
    where: { entityType: 'Booking' },
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const formattedBookings: MasterBookingItem[] = rawBookings.map((b) => {
    const logs = bookingAuditLogs
      .filter((log) => log.entityId === b.id)
      .map((log) => ({
        id: log.id,
        action: log.action,
        userName: log.user?.name || log.user?.email || 'System Operation',
        userRole: log.user?.role || null,
        details: log.details as any,
        createdAt: log.createdAt.toISOString(),
      }));

    return {
      id: b.id,
      referenceCode: b.referenceCode,
      serviceType: b.serviceType,
      serviceTitle:
        b.serviceType === 'TOUR'
          ? b.tour?.title || 'Tour Excursion'
          : `${b.pickupLocation || 'Pickup'} → ${b.dropoffLocation || 'Drop-off'}`,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      customerPhone: b.customerPhone,
      customerCountry: b.customerCountry || null,
      locale: b.locale || 'en',
      bookingDate: b.bookingDate.toISOString().slice(0, 10),
      rawBookingDate: b.bookingDate.toISOString(),
      bookingTime: b.bookingTime || null,
      numAdults: b.numAdults,
      numChildren: b.numChildren,
      pickupLocation: b.pickupLocation || null,
      dropoffLocation: b.dropoffLocation || null,
      specialRequests: b.specialRequests || null,
      operatorId: b.operatorId,
      operatorName: b.operator?.companyName || b.operator?.businessName || b.operator?.name || 'Zansafari Horizon',
      status: b.status,
      paymentStatus: b.paymentStatus,
      amountPaidCents: b.amountPaidCents || 0,
      totalPriceCents: b.totalPriceCents || 0,
      quotedPriceCents: b.quotedPriceCents || b.totalPriceCents || 0,
      costCents: b.costCents,
      profitCents: b.profitCents,
      commissionRate: b.commissionRate ? Number(b.commissionRate) * 100 : null,
      commissionAmountCents: b.commissionAmountCents,
      commissionStatus: b.commissionStatus,
      cancellationReason: b.cancellationReason || null,
      operatorNotes: b.operatorNotes || null,
      createdAt: b.createdAt.toISOString(),
      guideName: b.guideName || null,
      guidePhone: b.guidePhone || null,
      guideNotes: b.guideNotes || null,
      leadForwardedAt: b.leadForwardedAt ? b.leadForwardedAt.toISOString() : null,
      workOrderSentAt: b.workOrderSentAt ? b.workOrderSentAt.toISOString() : null,
      checkedInAt: b.checkedInAt ? b.checkedInAt.toISOString() : null,
      checkedInByName: b.checkedInBy?.name || b.checkedInBy?.email || null,
      receiptNumber: b.receipt?.receiptNumber || null,
      verificationCode: b.receipt?.verificationCode || null,
      payments: b.payments.map((p) => ({
        id: p.id,
        amountPaidCents: p.amountPaidCents,
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate.toISOString(),
        paymentReference: p.paymentReference || null,
        notes: p.notes || null,
        recordedByName: p.recordedBy?.name || p.recordedBy?.email || 'Unknown',
      })),
      auditLogs: logs,
    };
  });

  // Operators list for filter dropdown
  const operators = await prisma.companyProfile.findMany({
    select: { id: true, name: true, businessName: true, companyName: true },
  });

  return (
    <PlatformBookingsMasterClient
      initialBookings={formattedBookings}
      adminName={user.name}
      adminEmail={user.email}
      operators={operators.map((op: any) => ({
        id: op.id,
        name: op.companyName || op.businessName || op.name,
      }))}
      leadGuide={{
        leadGuideName: companyProfile.leadGuideName || 'Ibrahim',
        leadGuidePhone: companyProfile.leadGuidePhone || '+255 618 769 150',
        leadGuideWhatsApp: companyProfile.leadGuideWhatsApp || '+255 618 769 150',
        leadGuideEmail: companyProfile.leadGuideEmail || 'info@zansafarihorizon.com',
      }}
    />
  );
}
