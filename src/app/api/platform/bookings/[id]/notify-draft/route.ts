import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { buildNotifyDraft } from '@/lib/operator-inbox';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * P1 — Super-admin "Notify operator": auto-generated simple-English
 * assignment summary, editable in the UI before sending. Also returns
 * previous inbox messages for this booking (send history).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.PLATFORM_ADMIN]);
    const { id: bookingId } = await context.params;

    const draft = await buildNotifyDraft(bookingId);

    const history = await prisma.operatorInbox.findMany({
      where: { bookingId },
      include: { sentBy: { select: { name: true, email: true } } },
      orderBy: { sentAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      draft,
      history: history.map((h) => ({
        id: h.id,
        message: h.message,
        sentAt: h.sentAt.toISOString(),
        readAt: h.readAt ? h.readAt.toISOString() : null,
        sentByName: h.sentBy?.name || h.sentBy?.email || 'Super admin',
      })),
    });
  } catch (error: any) {
    console.error('Error building notify draft:', error);
    const status = error?.message === 'Booking not found.' ? 404 : 500;
    return NextResponse.json({ error: error?.message || 'Failed to build draft.' }, { status });
  }
}
