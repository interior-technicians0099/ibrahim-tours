import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';

/**
 * PATCH /api/platform/operators/[id]
 * Updates operator commission override and TRA licensing credentials.
 * Accessible ONLY to PLATFORM_ADMIN.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN]);
    const { id: operatorId } = await context.params;

    const operator = await prisma.operatorProfile.findUnique({
      where: { id: operatorId },
    });

    if (!operator) {
      return NextResponse.json({ error: 'Operator not found.' }, { status: 404 });
    }

    const body = await request.json();
    const {
      commissionRate,
      traLicenseNumber,
      traLicenseExpiry,
      traLicenseUrl,
      paymentNotes,
      paymentInstructions,
      mpesaNumber,
      bankName,
      bankAccount,
    } = body;

    let normalizedRate: any = undefined;
    if (commissionRate !== undefined) {
      if (commissionRate === null || commissionRate === '') {
        normalizedRate = null;
      } else {
        const num = Number(commissionRate);
        if (isNaN(num) || num < 0 || num > 100) {
          return NextResponse.json(
            { error: 'Commission rate must be a percentage between 0 and 100, or null.' },
            { status: 400 }
          );
        }
        normalizedRate = (num / 100).toFixed(4); // Store as Decimal e.g. 0.1500
      }
    }

    const updated = await prisma.operatorProfile.update({
      where: { id: operatorId },
      data: {
        ...(commissionRate !== undefined ? { commissionRate: normalizedRate } : {}),
        ...(traLicenseNumber !== undefined
          ? { traLicenseNumber: traLicenseNumber ? String(traLicenseNumber).trim() : null }
          : {}),
        ...(traLicenseExpiry !== undefined
          ? { traLicenseExpiry: traLicenseExpiry ? new Date(traLicenseExpiry) : null }
          : {}),
        ...(traLicenseUrl !== undefined
          ? { traLicenseUrl: traLicenseUrl ? String(traLicenseUrl).trim() : null }
          : {}),
        ...(paymentNotes !== undefined ? { paymentNotes: paymentNotes ? String(paymentNotes).trim() : null } : {}),
        ...(paymentInstructions !== undefined ? { paymentInstructions: String(paymentInstructions).trim() } : {}),
        ...(mpesaNumber !== undefined ? { mpesaNumber: mpesaNumber ? String(mpesaNumber).trim() : null } : {}),
        ...(bankName !== undefined ? { bankName: bankName ? String(bankName).trim() : null } : {}),
        ...(bankAccount !== undefined ? { bankAccount: bankAccount ? String(bankAccount).trim() : null } : {}),
      },
    });

    // Write to AuditLog
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_OPERATOR_CONFIG',
        entityType: 'OperatorProfile',
        entityId: operatorId,
        details: {
          operatorName: operator.name,
          commissionRate: commissionRate !== undefined ? commissionRate : operator.commissionRate,
          traLicenseNumber,
          traLicenseExpiry,
          traLicenseUrl,
        },
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      operator: updated,
      message: 'Operator configuration and TRA licensing updated successfully.',
    });
  } catch (error: any) {
    console.error('Error updating operator:', error);
    const isAuthError =
      error?.message?.includes('Forbidden') || error?.message?.includes('Unauthorized');
    return NextResponse.json(
      { error: error?.message || 'Failed to update operator.' },
      { status: isAuthError ? 403 : 500 }
    );
  }
}
