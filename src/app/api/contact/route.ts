import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contactInputSchema } from '@/lib/validations/contact';
import { checkContactRateLimit } from '@/lib/contact-rate-limiter';
import { NotificationRecipient, NotificationChannel } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // 1. IP Rate limiting
    const ip =
      request.headers.get('x-client-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateLimit = checkContactRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many contact requests from this address. Please try again in ${rateLimit.retryAfterMinutes} minutes or contact Ibrahim directly via WhatsApp.`,
        },
        { status: 429 }
      );
    }

    // 2. Parse & Zod validate payload
    const body = await request.json().catch(() => ({}));
    const parseResult = contactInputSchema.safeParse(body);

    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          error: 'Validation failed. Please check the fields.',
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, phone, message, honeypot } = parseResult.data;

    // 3. Honeypot spam rejection
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json(
        { error: 'Spam submission detected.' },
        { status: 400 }
      );
    }

    // 4. Record Notification in database
    await prisma.notification.create({
      data: {
        recipient: NotificationRecipient.OPERATOR,
        channel: NotificationChannel.EMAIL,
        type: 'CONTACT_INQUIRY',
        payload: {
          subject: `New Contact Inquiry from ${name}`,
          content: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`,
        },
        sentAt: new Date(),
      },
    });

    // 5. Complete AuditLog coverage
    await prisma.auditLog.create({
      data: {
        action: 'CONTACT_INQUIRY',
        entityType: 'Contact',
        details: {
          name,
          email,
          phone,
          messagePreview: message.slice(0, 100),
        },
        ipAddress: ip,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your inquiry has been received. Ibrahim will get back to you shortly!',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to process contact inquiry:', error);
    return NextResponse.json(
      { error: 'Internal server error processing contact request.' },
      { status: 500 }
    );
  }
}
