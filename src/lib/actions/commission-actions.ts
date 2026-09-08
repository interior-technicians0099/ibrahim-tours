'use server';

import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { recalculateUnsettledCommissions } from '@/lib/commission';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Recalculates platform commission across all unsettled bookings
 * that were completed when commission rate was pending (PENDING_RATE).
 * Accessible ONLY to PLATFORM_ADMIN.
 */
export async function recalculateUnsettledCommissionsAction(formData?: FormData) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN]);
    const operatorId = formData?.get('operatorId') as string | undefined;

    const result = await recalculateUnsettledCommissions({
      operatorId: operatorId || undefined,
    });

    if (result.success && result.recalculatedCount > 0) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'RECALCULATE_UNSETTLED_COMMISSIONS',
          entityType: 'Booking',
          details: {
            recalculatedCount: result.recalculatedCount,
            operatorId: operatorId || 'ALL',
            bookings: result.bookings.map((b) => b.referenceCode),
          },
        },
      });

      revalidatePath('/platform');
      revalidatePath('/platform/settlements');
    }

    return result;
  } catch (error: any) {
    console.error('Error in recalculateUnsettledCommissionsAction:', error);
    return {
      success: false,
      message: error?.message || 'Failed to recalculate unsettled commissions.',
      recalculatedCount: 0,
      bookings: [],
    };
  }
}
