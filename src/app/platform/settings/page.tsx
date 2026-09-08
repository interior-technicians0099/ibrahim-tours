import React from 'react';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { getGlobalCommissionRate } from '@/lib/services/commission-service';
import PlatformSettingsClient from '@/components/platform/PlatformSettingsClient';

export default async function PlatformSettingsPage() {
  const user = await requireRole(Role.PLATFORM_ADMIN);
  const globalRate = await getGlobalCommissionRate();

  return (
    <PlatformSettingsClient
      initialRate={globalRate}
      adminEmail={user.email}
    />
  );
}
