import React from 'react';
import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import PlatformNav from '@/components/platform/PlatformNav';
import { listPaymentMethods } from '@/lib/payment-methods';
import PlatformPaymentMethodsClient from '@/components/platform/PlatformPaymentMethodsClient';

export const metadata: Metadata = {
  title: 'Payment Methods | Platform Administration',
  description: 'Super-admin checkout method configuration shown to tourists.',
  robots: { index: false, follow: false },
};

export default async function PlatformPaymentMethodsPage() {
  const user = await requireRole([Role.PLATFORM_ADMIN]);
  const methods = await listPaymentMethods();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PlatformNav adminName={user.name || undefined} adminEmail={user.email || undefined} />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <PlatformPaymentMethodsClient initialMethods={JSON.parse(JSON.stringify(methods))} />
      </main>
    </div>
  );
}
