import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { retryNotification } from '@/lib/services/email-service';

export const dynamic = 'force-dynamic';

/**
 * P0 — Retry a FAILED notification (super-admin only).
 * POST /api/platform/notifications/:id/resend
 * Regenerates the template from live booking data, re-sends, and updates
 * the SAME row to SENT/FAILED.
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.PLATFORM_ADMIN]);
  } catch {
    return NextResponse.json(
      { error: 'Forbidden: PLATFORM_ADMIN only.' },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Missing notification id.' }, { status: 400 });
  }

  try {
    const result = await retryNotification(id);
    if (result.ok) {
      return NextResponse.json({
        success: true,
        message: 'Email re-sent successfully.',
        providerId: result.providerId || null,
      });
    }
    return NextResponse.json(
      { success: false, error: result.error || 'Resend failed.' },
      { status: 502 }
    );
  } catch (err: any) {
    console.error('[api/platform/notifications/resend] Failed:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to resend notification.' },
      { status: 500 }
    );
  }
}
