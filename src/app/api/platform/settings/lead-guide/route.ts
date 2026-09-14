import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { getCompanyProfile } from '@/lib/company';

export async function GET() {
  try {
    await requireRole([Role.PLATFORM_ADMIN, Role.COMPANY_ADMIN]);
    const profile = await getCompanyProfile();

    return NextResponse.json({
      leadGuideName: profile.leadGuideName || 'Ibrahim',
      leadGuidePhone: profile.leadGuidePhone || '+255 618 769 150',
      leadGuideWhatsApp: profile.leadGuideWhatsApp || '+255 618 769 150',
      leadGuideEmail: profile.leadGuideEmail || 'info@zansafarihorizon.com',
    });
  } catch (error: any) {
    console.error('Error fetching lead guide settings:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch lead guide settings.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN, Role.COMPANY_ADMIN]);
    const body = await request.json();

    const { leadGuideName, leadGuidePhone, leadGuideWhatsApp, leadGuideEmail } = body;

    const dataToUpdate: any = {};
    if (leadGuideName !== undefined) dataToUpdate.leadGuideName = String(leadGuideName).trim();
    if (leadGuidePhone !== undefined) dataToUpdate.leadGuidePhone = String(leadGuidePhone).trim();
    if (leadGuideWhatsApp !== undefined) dataToUpdate.leadGuideWhatsApp = String(leadGuideWhatsApp).trim();
    if (leadGuideEmail !== undefined) dataToUpdate.leadGuideEmail = String(leadGuideEmail).trim();

    // Update all CompanyProfile rows so they stay in sync
    await prisma.companyProfile.updateMany({
      data: dataToUpdate,
    });

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LEAD_GUIDE_SETTINGS_UPDATED',
        entityType: 'CompanyProfile',
        details: dataToUpdate,
        ipAddress: clientIp,
      },
    });

    const updatedProfile = await getCompanyProfile();

    return NextResponse.json({
      success: true,
      leadGuide: {
        leadGuideName: updatedProfile.leadGuideName,
        leadGuidePhone: updatedProfile.leadGuidePhone,
        leadGuideWhatsApp: updatedProfile.leadGuideWhatsApp,
        leadGuideEmail: updatedProfile.leadGuideEmail,
      },
      message: "Ibrahim's contact credentials updated successfully.",
    });
  } catch (error: any) {
    console.error('Error updating lead guide settings:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update lead guide settings.' },
      { status: 500 }
    );
  }
}
