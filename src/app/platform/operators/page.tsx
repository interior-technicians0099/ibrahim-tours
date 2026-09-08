import React from 'react';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role, BookingStatus } from '@prisma/client';
import { getGlobalCommissionRate } from '@/lib/services/commission-service';
import OperatorManagementClient, {
  OperatorDetails,
} from '@/components/platform/OperatorManagementClient';

export default async function PlatformOperatorsPage() {
  await requireRole(Role.PLATFORM_ADMIN);

  const rawOperators = await prisma.operatorProfile.findMany({
    include: {
      tours: true,
      vehicles: true,
      bookings: {
        where: { status: BookingStatus.COMPLETED },
      },
    },
  });

  const globalRate = await getGlobalCommissionRate();

  const formattedOperators: OperatorDetails[] = rawOperators.map((op: any) => ({
    id: op.id,
    name: op.name,
    businessName: op.businessName,
    phone: op.phone,
    whatsapp: op.whatsapp,
    email: op.email,
    yearsExperience: op.yearsExperience,
    commissionRate: op.commissionRate ? Number(op.commissionRate) * 100 : null,
    traLicenseNumber: op.traLicenseNumber,
    traLicenseExpiry: op.traLicenseExpiry ? op.traLicenseExpiry.toISOString() : null,
    traLicenseUrl: op.traLicenseUrl,
    paymentInstructions: op.paymentInstructions || '',
    paymentNotes: op.paymentNotes || null,
    mpesaNumber: op.mpesaNumber || null,
    bankName: op.bankName || null,
    bankAccount: op.bankAccount || null,
    toursCount: op.tours?.length || 0,
    vehiclesCount: op.vehicles?.length || 0,
    completedBookingsCount: op.bookings?.length || 0,
  }));

  return (
    <OperatorManagementClient
      operators={formattedOperators}
      globalRate={globalRate}
    />
  );
}
