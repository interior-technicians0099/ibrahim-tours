import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getScopedOperatorId } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
    const scopedOperatorId = await getScopedOperatorId();

    const profile = scopedOperatorId
      ? await prisma.operatorProfile.findUnique({ where: { id: scopedOperatorId } })
      : await prisma.operatorProfile.findFirst();

    if (!profile) {
      return NextResponse.json({ error: 'Operator profile not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch profile.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
    const scopedOperatorId = await getScopedOperatorId();

    const existingProfile = scopedOperatorId
      ? await prisma.operatorProfile.findUnique({ where: { id: scopedOperatorId } })
      : await prisma.operatorProfile.findFirst();

    if (!existingProfile) {
      return NextResponse.json({ error: 'Operator profile not found.' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      businessName,
      phone,
      whatsapp,
      email,
      biography,
      paymentInstructions,
      paymentNotes,
      traLicenseNumber,
      traLicenseExpiry,
      traLicenseUrl,
      profilePhotoUrl,
      mpesaNumber,
      bankName,
      bankAccount,
      languages,
    } = body;

    const updatedProfile = await prisma.operatorProfile.update({
      where: { id: existingProfile.id },
      data: {
        name: name !== undefined ? String(name).trim() : existingProfile.name,
        businessName: businessName !== undefined ? String(businessName).trim() : existingProfile.businessName,
        phone: phone !== undefined ? String(phone).trim() : existingProfile.phone,
        whatsapp: whatsapp !== undefined ? String(whatsapp).trim() : existingProfile.whatsapp,
        email: email !== undefined ? String(email).trim() : existingProfile.email,
        biography: biography !== undefined ? String(biography).trim() : existingProfile.biography,
        profilePhotoUrl: profilePhotoUrl !== undefined ? profilePhotoUrl : existingProfile.profilePhotoUrl,
        traLicenseNumber:
          traLicenseNumber !== undefined
            ? String(traLicenseNumber).trim()
            : existingProfile.traLicenseNumber,
        traLicenseExpiry: traLicenseExpiry ? new Date(traLicenseExpiry) : existingProfile.traLicenseExpiry,
        traLicenseUrl: traLicenseUrl !== undefined ? traLicenseUrl : existingProfile.traLicenseUrl,
        paymentInstructions:
          paymentInstructions !== undefined
            ? String(paymentInstructions).trim()
            : existingProfile.paymentInstructions,
        paymentNotes:
          paymentNotes !== undefined ? String(paymentNotes).trim() : existingProfile.paymentNotes,
        mpesaNumber: mpesaNumber !== undefined ? String(mpesaNumber).trim() : existingProfile.mpesaNumber,
        bankName: bankName !== undefined ? String(bankName).trim() : existingProfile.bankName,
        bankAccount: bankAccount !== undefined ? String(bankAccount).trim() : existingProfile.bankAccount,
        languages: Array.isArray(languages) ? languages : existingProfile.languages,
      },
    });

    // Write to AuditLog
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_OPERATOR_PROFILE',
        entityType: 'OperatorProfile',
        entityId: existingProfile.id,
        details: {
          updatedFields: Object.keys(body),
          operatorId: existingProfile.id,
          operatorName: updatedProfile.name,
        },
        ipAddress: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Operator profile updated successfully.',
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error('Error updating operator profile:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update profile.' },
      { status: 500 }
    );
  }
}
