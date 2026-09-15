import React from 'react';
import { requireRole, getScopedOperatorId } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import OperatorProfileClient from '@/components/operator/OperatorProfileClient';

export default async function OperatorProfilePage() {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN, Role.COMPANY_ADMIN]);
  const scopedOperatorId = await getScopedOperatorId();

  const profile = scopedOperatorId
    ? await prisma.companyProfile.findUnique({ where: { id: scopedOperatorId } })
    : await prisma.companyProfile.findFirst();

  const initialProfile = {
    id: profile?.id || 'operator-ibrahim',
    name: profile?.name || 'Operations Lead',
    businessName: profile?.companyName || profile?.businessName || 'Zansafari Horizon',
    phone: profile?.officialPhone || profile?.phone || '+255 618 769 150',
    whatsapp: profile?.officialWhatsapp || profile?.whatsapp || '+255 618 769 150',
    email: profile?.officialEmail || profile?.email || 'info@zansafarihorizon.com',
    biography:
      profile?.biography ||
      'Registered tour operator and premier safari & excursion company in Zanzibar providing private excursions, Stone Town heritage tours, Safari Blue, and airport transfers.',
    paymentInstructions:
      profile?.paymentInstructions ||
      'Your booking request has been reviewed and confirmed. To secure your reservation, please send the full payment to the M-Pesa number or Bank Account provided below. Your booking is confirmed only when full payment is received.',
    paymentNotes: profile?.paymentNotes || null,
    mpesaNumber: profile?.mpesaNumber || '+255 618 769 150 (Zansafari Horizon)',
    bankName: profile?.bankName || 'CRDB Bank Zanzibar',
    bankAccount: profile?.bankAccount || '0150 0000 0000 0',
    traLicenseNumber: profile?.traLicenseNumber || 'TRA-ZNZ-2024-8841',
    traLicenseExpiry: profile?.traLicenseExpiry ? profile.traLicenseExpiry.toISOString().split('T')[0] : '',
    traLicenseUrl: profile?.traLicenseUrl || null,
    profilePhotoUrl: profile?.profilePhotoUrl || null,
    languages: profile?.languages || ['English', 'Italian', 'Swahili'],
  };

  return (
    <OperatorProfileClient
      initialProfile={initialProfile}
      userRole={user.role}
      userEmail={user.email}
      isReadOnly={user.role === Role.OPERATOR}
    />
  );
}
