import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getScopedOperatorId } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { brandingSettingsSchema } from '@/lib/validations/branding';
import { revalidateCompanyProfile } from '@/lib/company';

export async function GET() {
  try {
    const user = await requireRole([Role.COMPANY_ADMIN, Role.PLATFORM_ADMIN, Role.OPERATOR]);
    const scopedOperatorId = await getScopedOperatorId();
    const profile =
      (scopedOperatorId ? await prisma.companyProfile.findUnique({ where: { id: scopedOperatorId } }) : null) ||
      (await prisma.companyProfile.findUnique({ where: { id: 'operator-ibrahim' } })) ||
      (await prisma.companyProfile.findFirst({ orderBy: { updatedAt: 'desc' } }));

    if (!profile) {
      return NextResponse.json({ error: 'Company profile not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch branding settings.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole([Role.COMPANY_ADMIN, Role.PLATFORM_ADMIN, Role.OPERATOR]);
    const scopedOperatorId = await getScopedOperatorId();
    const existingProfile =
      (scopedOperatorId ? await prisma.companyProfile.findUnique({ where: { id: scopedOperatorId } }) : null) ||
      (await prisma.companyProfile.findUnique({ where: { id: 'operator-ibrahim' } })) ||
      (await prisma.companyProfile.findFirst({ orderBy: { updatedAt: 'desc' } }));

    if (!existingProfile) {
      return NextResponse.json({ error: 'Company profile not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = brandingSettingsSchema.safeParse(body);

    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: 'Validation failed.', details: fieldErrors },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    const updatedProfile = await prisma.companyProfile.update({
      where: { id: existingProfile.id },
      data: {
        companyName: data.companyName,
        tagline: data.tagline,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl : existingProfile.logoUrl,
        faviconUrl: data.faviconUrl !== undefined ? data.faviconUrl : existingProfile.faviconUrl,
        officialPhone: data.officialPhone,
        officialEmail: data.officialEmail,
        officialWhatsapp: data.officialWhatsapp,
        phone: data.officialPhone,
        email: data.officialEmail,
        whatsapp: data.officialWhatsapp,
        registrationNumber: data.registrationNumber !== undefined ? data.registrationNumber : existingProfile.registrationNumber,
        traLicenseNumber: data.traLicenseNumber !== undefined ? data.traLicenseNumber : existingProfile.traLicenseNumber,
        traLicenseExpiry: data.traLicenseExpiry ? new Date(data.traLicenseExpiry) : existingProfile.traLicenseExpiry,
        traLicenseUrl: data.traLicenseUrl !== undefined ? data.traLicenseUrl : existingProfile.traLicenseUrl,
        mpesaNumber: data.mpesaNumber !== undefined ? data.mpesaNumber : existingProfile.mpesaNumber,
        bankName: data.bankName !== undefined ? data.bankName : existingProfile.bankName,
        bankAccount: data.bankAccount !== undefined ? data.bankAccount : existingProfile.bankAccount,
        paymentInstructions:
          data.paymentInstructions !== undefined && data.paymentInstructions !== null
            ? data.paymentInstructions
            : existingProfile.paymentInstructions,
        paymentNotes: data.paymentNotes !== undefined ? data.paymentNotes : existingProfile.paymentNotes,
        biography: data.biography !== undefined && data.biography !== null ? data.biography : existingProfile.biography,
        shortBio: data.shortBio !== undefined ? data.shortBio : existingProfile.shortBio,
      },
    });

    // Write AuditLog
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_COMPANY_BRANDING',
        entityType: 'CompanyProfile',
        entityId: existingProfile.id,
        details: {
          companyName: updatedProfile.companyName,
          updatedFields: Object.keys(data),
          editorRole: user.role,
        },
        ipAddress: clientIp,
      },
    });

    // Instant ISR Revalidation across the entire site
    await revalidateCompanyProfile();

    return NextResponse.json({
      success: true,
      message: 'Company branding and profile updated successfully. Site revalidated instantly.',
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error('Error updating company branding:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update branding settings.' },
      { status: 500 }
    );
  }
}
