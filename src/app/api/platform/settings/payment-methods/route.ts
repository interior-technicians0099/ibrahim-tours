import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { listPaymentMethods, PAYMENT_METHOD_CODES } from '@/lib/payment-methods';
import { Role } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const MethodSchema = z.object({
  code: z.enum(PAYMENT_METHOD_CODES as unknown as [string, ...string[]]),
  enabled: z.boolean(),
  label: z.string().max(60).nullable().optional(),
  details: z.record(z.string(), z.string().max(200)).default({}),
  sortOrder: z.number().int().min(0).max(100).optional(),
});

const PutSchema = z.object({
  methods: z.array(MethodSchema).min(1).max(10),
});

/**
 * P1 — Super-admin payment method settings.
 * GET lists all methods; PUT replaces enabled flags + details.
 */
export async function GET() {
  try {
    await requireRole([Role.PLATFORM_ADMIN]);
    const methods = await listPaymentMethods();
    return NextResponse.json({ success: true, methods });
  } catch (error: any) {
    console.error('Error loading payment methods:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load payment methods.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN]);
    const body = await request.json();
    const parsed = PutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payment methods payload.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    for (const [index, m] of parsed.data.methods.entries()) {
      await prisma.paymentMethodConfig.upsert({
        where: { code: m.code },
        update: {
          enabled: m.enabled,
          label: m.label?.trim() ? m.label.trim() : null,
          details: m.details,
          sortOrder: m.sortOrder ?? index,
        },
        create: {
          code: m.code,
          enabled: m.enabled,
          label: m.label?.trim() || null,
          details: m.details,
          sortOrder: m.sortOrder ?? index,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PAYMENT_METHODS_UPDATED',
        entityType: 'Settings',
        entityId: 'payment-methods',
        details: {
          methods: parsed.data.methods.map((m) => ({ code: m.code, enabled: m.enabled })),
        },
        ipAddress: clientIp,
      },
    });

    const methods = await listPaymentMethods();
    return NextResponse.json({ success: true, methods });
  } catch (error: any) {
    console.error('Error saving payment methods:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save payment methods.' },
      { status: 500 }
    );
  }
}
