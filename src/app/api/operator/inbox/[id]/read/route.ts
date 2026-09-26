import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getScopedOperatorId } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * P1 — Mark an inbox message as read (operator portal unread badges).
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN]);
    const { id } = await context.params;
    const scopedOperatorId = await getScopedOperatorId();

    const message = await prisma.operatorInbox.findUnique({
      where: { id },
      include: { booking: { select: { operatorId: true } } },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    }

    if (
      user.role === Role.OPERATOR &&
      scopedOperatorId &&
      message.booking.operatorId !== scopedOperatorId
    ) {
      return NextResponse.json({ error: 'Forbidden: not your assignment.' }, { status: 403 });
    }

    const updated = await prisma.operatorInbox.update({
      where: { id },
      data: { readAt: message.readAt || new Date() },
      select: { id: true, readAt: true },
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (error: any) {
    console.error('Error marking inbox message as read:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to mark as read.' },
      { status: error?.message?.includes('403') ? 403 : 500 }
    );
  }
}
