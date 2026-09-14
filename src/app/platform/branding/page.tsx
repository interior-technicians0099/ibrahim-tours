import React from 'react';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { getCompanyProfile } from '@/lib/company';
import BrandingManagerClient, { BrandingData } from '@/components/admin/BrandingManagerClient';

export const metadata = {
  title: 'Branding & Company Settings | Zansafari Horizon Platform',
  description: 'Manage company branding, logo, contacts, registration and payment details.',
};

export default async function PlatformBrandingPage() {
  await requireRole(Role.PLATFORM_ADMIN);
  const profile = await getCompanyProfile();

  const initialData: BrandingData = {
    id: profile.id,
    companyName: profile.companyName,
    tagline: profile.tagline,
    logoUrl: profile.logoUrl,
    faviconUrl: profile.faviconUrl,
    officialPhone: profile.officialPhone,
    officialEmail: profile.officialEmail,
    officialWhatsapp: profile.officialWhatsapp,
    registrationNumber: profile.registrationNumber,
    traLicenseNumber: profile.traLicenseNumber,
    traLicenseExpiry: profile.traLicenseExpiry ? profile.traLicenseExpiry.split('T')[0] : '',
    traLicenseUrl: profile.traLicenseUrl,
    mpesaNumber: profile.mpesaNumber,
    bankName: profile.bankName,
    bankAccount: profile.bankAccount,
    paymentInstructions: profile.paymentInstructions || '',
    paymentNotes: profile.paymentNotes,
    biography: profile.biography,
    shortBio: profile.shortBio,
  };

  return <BrandingManagerClient initialData={initialData} />;
}
