import React from 'react';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { getGlobalCommissionRate } from '@/lib/services/commission-service';
import { getCompanyProfile } from '@/lib/company';
import PlatformSettingsClient from '@/components/platform/PlatformSettingsClient';

export default async function PlatformSettingsPage() {
  const user = await requireRole(Role.PLATFORM_ADMIN);
  const globalRate = await getGlobalCommissionRate();
  const companyProfile = await getCompanyProfile();

  return (
    <PlatformSettingsClient
      initialRate={globalRate}
      adminEmail={user.email}
      initialLeadGuide={{
        leadGuideName: companyProfile.leadGuideName || 'Ibrahim',
        leadGuidePhone: companyProfile.leadGuidePhone || '+255 618 769 150',
        leadGuideWhatsApp: companyProfile.leadGuideWhatsApp || '+255 618 769 150',
        leadGuideEmail: companyProfile.leadGuideEmail || 'info@zansafarihorizon.com',
      }}
    />
  );
}
