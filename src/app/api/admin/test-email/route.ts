import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { sendDiagnosticTestEmail, getAppBaseUrl } from '@/lib/services/email-service';

export const dynamic = 'force-dynamic';

/**
 * P0 — Super-admin-only email diagnostic.
 * POST /api/admin/test-email { "to": "you@example.com" }
 * Sends via Resend and RETURNS the raw Resend response/error so delivery
 * can be verified without guessing (key present? FROM verified? 403 sandbox?).
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole([Role.PLATFORM_ADMIN]);
  } catch (err: any) {
    const msg = err?.message || 'Forbidden';
    if (String(msg).includes('/login') || String(msg).includes('NEXT_REDIRECT')) {
      return NextResponse.json({ error: 'Unauthorized — please log in as PLATFORM_ADMIN.' }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  let to = '';
  try {
    const body = await request.json();
    to = String(body?.to || '').trim();
  } catch {
    to = '';
  }

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json(
      { error: 'Provide a valid "to" email address in the JSON body.' },
      { status: 400 }
    );
  }

  try {
    const result = await sendDiagnosticTestEmail(to);
    return NextResponse.json(
      {
        ok: result.ok,
        to,
        from: result.from,
        providerId: result.providerId || null,
        resendStatus: result.status || null,
        error: result.error || null,
        appUrl: getAppBaseUrl(),
        hasApiKey: Boolean(process.env.RESEND_API_KEY),
      },
      { status: result.ok ? 200 : 502 }
    );
  } catch (err: any) {
    console.error('[api/admin/test-email] Unexpected error:', err);
    return NextResponse.json(
      { ok: false, to, error: err?.message || 'Unexpected test-email failure.' },
      { status: 500 }
    );
  }
}
