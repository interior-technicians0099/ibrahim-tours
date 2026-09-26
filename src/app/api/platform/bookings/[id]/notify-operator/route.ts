import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { buildOperatorWhatsAppUrl, resolveOperatorContact } from '@/lib/operator-inbox';
import { sendOperatorAssignmentEmail } from '@/lib/services/email-service';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * P1 — Super-admin "Notify operator" send action. Creates the OperatorInbox
 * row (the ONLY channel by which operators learn about bookings), audits it,
 * optionally emails the operator, and returns a prefilled wa.me link.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN]);
    const { id: bookingId } = await context.params;

    const body = await request.json().catch(() => ({}));
    const message = String(body?.message || '').trim();
    const sendEmail = Boolean(body?.sendEmail);

    if (message.length < 10) {
      return NextResponse.json(
        { error: 'Message is too short — please keep the assignment summary.' },
        { status: 400 }
      );
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message exceeds 2000 characters.' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { operator: true },
    });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    const operator = await resolveOperatorContact(booking.operatorId);

    const inbox = await prisma.operatorInbox.create({
      data: {
        bookingId: booking.id,
        message,
        sentById: user.id,
      },
    });

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'OPERATOR_NOTIFIED',
        entityType: 'Booking',
        entityId: booking.id,
        details: {
          referenceCode: booking.referenceCode,
          inboxId: inbox.id,
          operatorName: operator.name,
          emailed: sendEmail,
        },
        ipAddress: clientIp,
      },
    });

    let emailed = false;
    let emailError: string | null = null;
    if (sendEmail) {
      try {
        const res = await sendOperatorAssignmentEmail({
          bookingId: booking.id,
          referenceCode: booking.referenceCode,
          operatorName: operator.name,
          operatorEmail: operator.email,
          message,
        });
        emailed = res.ok;
        emailError = res.error || null;
      } catch (err: any) {
        emailError = err?.message || 'Email dispatch failed.';
      }
    }

    return NextResponse.json({
      success: true,
      inboxId: inbox.id,
      whatsappUrl: buildOperatorWhatsAppUrl(operator.whatsapp, message),
      operatorPhone: operator.phone,
      emailed,
      emailError,
      message: `Operator notified for ${booking.referenceCode}.`,
    });
  } catch (error: any) {
    console.error('Error notifying operator:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to notify operator.' },
      { status: 500 }
    );
  }
}
