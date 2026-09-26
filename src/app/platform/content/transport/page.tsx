import React from 'react';
import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import PlatformNav from '@/components/platform/PlatformNav';
import TransportManagerClient from '@/components/operator/TransportManagerClient';

export const metadata: Metadata = {
  title: 'Transfers & Fleet | Platform Administration',
  description: 'Super-admin transfer routes and vehicle management.',
  robots: { index: false, follow: false },
};

export default async function PlatformTransportPage() {
  const user = await requireRole([Role.PLATFORM_ADMIN]);

  const [routes, vehicles] = await Promise.all([
    prisma.route.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.vehicle.findMany({ orderBy: { createdAt: 'asc' } }),
  ]);

  const formattedRoutes = routes.map((r) => ({
    id: r.id,
    origin: r.origin,
    destination: r.destination,
    durationText: r.durationText,
    distanceText: r.distanceText,
    pricingTiers: r.pricingTiers,
    isActive: r.isActive,
  }));

  const formattedVehicles = vehicles.map((v) => ({
    id: v.id,
    name: v.name,
    vehicleType: v.vehicleType,
    capacity: v.capacity,
    hasAc: v.hasAc,
    driverIncluded: v.driverIncluded,
    imageUrl: v.imageUrl,
    features: v.features,
    isActive: v.isActive,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PlatformNav adminName={user.name || undefined} adminEmail={user.email || undefined} />
      <TransportManagerClient
        initialRoutes={formattedRoutes}
        initialVehicles={formattedVehicles}
        userRole={user.role}
        userEmail={user.email}
      />
    </div>
  );
}
