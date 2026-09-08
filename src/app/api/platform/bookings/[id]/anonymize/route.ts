import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireRole(Role.PLATFORM_ADMIN);
    const { id: bookingId } = await context.params;

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 1. Fetch booking to verify existence and check if already anonymized
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    if (booking.customerName.startsWith('DELETED') && booking.customerEmail.includes('anonymized')) {
      return NextResponse.json(
        { error: 'Booking customer PII has already been deleted/anonymized.' },
        { status: 400 }
      );
    }

    // 2. Scrub customer PII while strictly preserving financial numbers for reconciliation
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        customerName: `DELETED-${bookingId}`,
        customerEmail: `deleted-${bookingId.slice(-6)}@anonymized.local`,
        customerPhone: `DELETED-${bookingId.slice(-6)}`,
        customerCountry: 'DELETED',
        pickupLocation: 'DELETED',
        dropoffLocation: 'DELETED',
        specialRequests: 'DELETED',
      },
    });

    // 3. Complete AuditLog coverage for GDPR deletion action
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'GDPR_ANONYMIZE_CUSTOMER',
        entityType: 'Booking',
        entityId: bookingId,
        details: {
          referenceCode: booking.referenceCode,
          anonymizedFields: [
            'customerName',
            'customerEmail',
            'customerPhone',
            'customerCountry',
            'pickupLocation',
            'dropoffLocation',
            'specialRequests',
          ],
          executedBy: adminUser.name || adminUser.email,
          reason: 'Right to erasure request (GDPR Art. 17 / Tanzanian PDPA)',
          timestamp: new Date().toISOString(),
        },
        ipAddress: ip,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Customer PII for booking ${booking.referenceCode} has been permanently scrubbed and anonymized under GDPR Article 17.`,
        booking: {
          id: updated.id,
          referenceCode: updated.referenceCode,
          customerName: updated.customerName,
          customerEmail: updated.customerEmail,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to anonymize booking customer data:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error while executing GDPR deletion.' },
      { status: 500 }
    );
  }
}
