import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { hash } from '@node-rs/argon2';
import { Role } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  email: z.string().email().max(120),
  name: z.string().min(2).max(80),
  // P1: only the two portal roles can be provisioned.
  role: z.enum(['PLATFORM_ADMIN', 'OPERATOR']),
  operatorId: z.string().min(1).max(64).nullable().optional(),
  tempPassword: z.string().min(8).max(72).optional(),
});

function safeUser(u: any) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    operatorId: u.operatorId,
    operatorName: u.operator?.companyName || null,
    isActive: u.isActive,
    mustChangePassword: u.mustChangePassword,
    lastLogin: u.lastLogin ? u.lastLogin.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  };
}

/**
 * P1 — Super-admin user management (the two portal roles only).
 */
export async function GET() {
  try {
    await requireRole([Role.PLATFORM_ADMIN]);
    const users = await prisma.adminUser.findMany({
      include: { operator: { select: { companyName: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const operators = await prisma.companyProfile.findMany({
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' },
    });
    return NextResponse.json({ success: true, users: users.map(safeUser), operators });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load users.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole([Role.PLATFORM_ADMIN]);
    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid user payload.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const tempPassword = parsed.data.tempPassword || `Zansafari-${Math.random().toString(36).slice(2, 10)}!`;
    const passwordHash = await hash(tempPassword);

    const created = await prisma.adminUser.create({
      data: {
        email,
        name: parsed.data.name.trim(),
        passwordHash,
        role: parsed.data.role as Role,
        operatorId: parsed.data.role === 'OPERATOR' ? parsed.data.operatorId || null : null,
        isActive: true,
        mustChangePassword: true,
      },
      include: { operator: { select: { companyName: true } } },
    });

    const forwardedFor = request.headers.get('x-forwarded-for');
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'ADMIN_USER_CREATED',
        entityType: 'AdminUser',
        entityId: created.id,
        details: { email: created.email, role: created.role },
        ipAddress: forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1',
      },
    });

    return NextResponse.json({
      success: true,
      user: safeUser(created),
      tempPassword: parsed.data.tempPassword ? undefined : tempPassword,
      message: `Account created for ${email}. They must change the temporary password on first login.`,
    });
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create user.' }, { status: 500 });
  }
}
