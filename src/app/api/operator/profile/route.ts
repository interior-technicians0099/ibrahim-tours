import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getScopedOperatorId } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { revalidateCompanyProfile } from '@/lib/company';

export async function GET() {
  try {
    const user = await requireRole([Role.COMPANY_ADMIN, Role.OPERATOR, Role.PLATFORM_ADMIN]);
    const scopedOperatorId = await getScopedOperatorId();

    const profile = scopedOperatorId
      ? await prisma.companyProfile.findUnique({ where: { id: scopedOperatorId } })
      : await prisma.companyProfile.findFirst();

    if (!profile) {
      return NextResponse.json({ error: 'Company profile not found.' }, { status: 404 });
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
    const user = await requireRole([Role.COMPANY_ADMIN, Role.OPERATOR, Role.PLATFORM_ADMIN]);
    const scopedOperatorId = await getScopedOperatorId();

    const existingProfile = scopedOperatorId
      ? await prisma.companyProfile.findUnique({ where: { id: scopedOperatorId } })
      : await prisma.companyProfile.findFirst();

    if (!existingProfile) {
      return NextResponse.json({ error: 'Company profile not found.' }, { status: 404 });
    }

    const body = await request.json();
    const {
      companyName,
      tagline,
      logoUrl,
      faviconUrl,
      officialPhone,
      officialEmail,
      officialWhatsapp,
      registrationNumber,
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

    const updatedProfile = await prisma.companyProfile.update({
      where: { id: existingProfile.id },
      data: {
        companyName: companyName !== undefined ? String(companyName).trim() : existingProfile.companyName,
        tagline: tagline !== undefined ? String(tagline).trim() : existingProfile.tagline,
        logoUrl: logoUrl !== undefined ? logoUrl : existingProfile.logoUrl,
        faviconUrl: faviconUrl !== undefined ? faviconUrl : existingProfile.faviconUrl,
        officialPhone: officialPhone !== undefined ? String(officialPhone).trim() : (phone || existingProfile.officialPhone),
        officialEmail: officialEmail !== undefined ? String(officialEmail).trim() : (email || existingProfile.officialEmail),
        officialWhatsapp: officialWhatsapp !== undefined ? String(officialWhatsapp).trim() : (whatsapp || existingProfile.officialWhatsapp),
        registrationNumber: registrationNumber !== undefined ? String(registrationNumber).trim() : existingProfile.registrationNumber,
        name: name !== undefined ? String(name).trim() : existingProfile.name,
        businessName: businessName !== undefined ? String(businessName).trim() : existingProfile.businessName,
        phone: officialPhone || phone || existingProfile.phone,
        whatsapp: officialWhatsapp || whatsapp || existingProfile.whatsapp,
        email: officialEmail || email || existingProfile.email,
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
        action: 'UPDATE_COMPANY_PROFILE',
        entityType: 'CompanyProfile',
        entityId: existingProfile.id,
        details: {
          updatedFields: Object.keys(body),
          companyId: existingProfile.id,
          companyName: updatedProfile.companyName,
        },
        ipAddress: clientIp,
      },
    });

    // Trigger instant ISR revalidation
    await revalidateCompanyProfile();

    return NextResponse.json({
      success: true,
      message: 'Company profile and branding updated successfully.',
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error('Error updating company profile:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update profile.' },
      { status: 500 }
    );
  }
}
