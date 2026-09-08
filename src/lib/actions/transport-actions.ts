'use server';

import { requireRole, getScopedOperatorId } from '@/lib/auth';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function saveRouteAction(data: {
  id?: string;
  origin: string;
  destination: string;
  durationText: string;
  distanceText?: string;
  pricingTiers: {
    van1to3: number; // in cents
    van4to6: number;
    miniBus7to12: number;
    bigBus13to25: number;
    costVan1to3?: number;
    costVan4to6?: number;
    costMiniBus7to12?: number;
    costBigBus13to25?: number;
  };
  isActive?: boolean;
}) {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
  const scopedOperatorId = await getScopedOperatorId();
  const effectiveOperatorId = scopedOperatorId || (await prisma.operatorProfile.findFirst())?.id || 'operator-ibrahim';

  // Ensure default transport service exists
  let transportService: any = await prisma.transportService.findFirst({
    where: { operatorId: effectiveOperatorId },
  });
  if (!transportService) {
    transportService = await prisma.transportService.findFirst();
  }
  if (!transportService) {
    transportService = await prisma.transportService.create({
      data: {
        slug: 'zanzibar-private-transfers',
        title: 'Zanzibar Private Transfers & Airport Taxi',
        operatorId: effectiveOperatorId,
      },
    });
  }

  let route: any;
  if (data.id) {
    route = await prisma.route.update({
      where: { id: data.id },
      data: {
        origin: data.origin.trim(),
        destination: data.destination.trim(),
        durationText: data.durationText.trim(),
        distanceText: data.distanceText?.trim() || null,
        pricingTiers: data.pricingTiers as any,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_ROUTE',
        entityType: 'Route',
        entityId: route.id,
        details: { origin: route.origin, destination: route.destination },
      },
    });
  } else {
    route = await prisma.route.create({
      data: {
        transportServiceId: transportService.id,
        origin: data.origin.trim(),
        destination: data.destination.trim(),
        durationText: data.durationText.trim(),
        distanceText: data.distanceText?.trim() || null,
        pricingTiers: data.pricingTiers as any,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_ROUTE',
        entityType: 'Route',
        entityId: route.id,
        details: { origin: route.origin, destination: route.destination },
      },
    });
  }

  revalidatePath('/transportation');
  revalidatePath('/operator/transport');
  revalidatePath('/');

  return { success: true, route };
}

export async function deleteRouteAction(id: string) {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);

  const route = await prisma.route.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'DELETE_ROUTE',
      entityType: 'Route',
      entityId: id,
      details: { origin: route.origin, destination: route.destination },
    },
  });

  revalidatePath('/transportation');
  revalidatePath('/operator/transport');

  return { success: true };
}

export async function saveVehicleAction(data: {
  id?: string;
  name: string;
  vehicleType: string;
  capacity: string;
  hasAc?: boolean;
  driverIncluded?: boolean;
  imageUrl?: string | null;
  features?: string[];
  isActive?: boolean;
}) {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
  const scopedOperatorId = await getScopedOperatorId();
  const effectiveOperatorId = scopedOperatorId || (await prisma.operatorProfile.findFirst())?.id || 'operator-ibrahim';

  let vehicle: any;
  if (data.id) {
    vehicle = await prisma.vehicle.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        vehicleType: data.vehicleType.trim(),
        capacity: data.capacity.trim(),
        hasAc: data.hasAc !== undefined ? Boolean(data.hasAc) : true,
        driverIncluded: data.driverIncluded !== undefined ? Boolean(data.driverIncluded) : true,
        imageUrl: data.imageUrl || null,
        features: (data.features || []) as any,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_VEHICLE',
        entityType: 'Vehicle',
        entityId: vehicle.id,
        details: { name: vehicle.name },
      },
    });
  } else {
    vehicle = await prisma.vehicle.create({
      data: {
        operatorId: effectiveOperatorId,
        name: data.name.trim(),
        vehicleType: data.vehicleType.trim(),
        capacity: data.capacity.trim(),
        hasAc: data.hasAc !== undefined ? Boolean(data.hasAc) : true,
        driverIncluded: data.driverIncluded !== undefined ? Boolean(data.driverIncluded) : true,
        imageUrl: data.imageUrl || null,
        features: (data.features || []) as any,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_VEHICLE',
        entityType: 'Vehicle',
        entityId: vehicle.id,
        details: { name: vehicle.name },
      },
    });
  }

  revalidatePath('/transportation');
  revalidatePath('/operator/transport');

  return { success: true, vehicle };
}

export async function deleteVehicleAction(id: string) {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);

  const vehicle = await prisma.vehicle.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'DELETE_VEHICLE',
      entityType: 'Vehicle',
      entityId: id,
      details: { name: vehicle.name },
    },
  });

  revalidatePath('/transportation');
  revalidatePath('/operator/transport');

  return { success: true };
}
