import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import TransportManagerClient from '@/components/operator/TransportManagerClient';

export default async function OperatorTransportPage() {
  await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);

  const [routes, vehicles] = await Promise.all([
    prisma.route.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.vehicle.findMany({
      orderBy: { createdAt: 'asc' },
    }),
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
    <TransportManagerClient
      initialRoutes={formattedRoutes}
      initialVehicles={formattedVehicles}
    />
  );
}
