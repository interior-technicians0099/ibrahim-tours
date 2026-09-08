import { NextRequest, NextResponse } from 'next/server';
import { runAllMonthlySettlements } from '@/lib/services/settlement-service';

/**
 * Calculates previous calendar month string "YYYY-MM" in UTC.
 * Example: if called in October 2026, returns "2026-09".
 */
export function getPreviousMonth(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth(); // 0-indexed (0 is Jan)
  const prevDate = new Date(Date.UTC(year, monthIndex - 1, 1));
  const prevYear = prevDate.getUTCFullYear();
  const prevMonth = String(prevDate.getUTCMonth() + 1).padStart(2, '0');
  return `${prevYear}-${prevMonth}`;
}

/**
 * Validates request authorization against CRON_SECRET.
 */
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // In local development or testing without CRON_SECRET, allow if secret query matches or in dev
    const secretQuery = request.nextUrl.searchParams.get('secret');
    if (secretQuery === 'local-test' || process.env.NODE_ENV === 'development') {
      return true;
    }
    return false;
  }

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/cron/monthly-settlement
 * Scheduled by Vercel Cron on the 1st of each month (00:00 UTC).
 * Auto-generates the previous month's settlement statements for all active operators
 * and dispatches statement notification emails.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing cron authorization header.' },
      { status: 401 }
    );
  }

  try {
    const overrideMonth = request.nextUrl.searchParams.get('month');
    const targetMonth = overrideMonth || getPreviousMonth();

    console.log(`[Vercel Cron] Triggering monthly settlement generation for ${targetMonth}...`);

    const settlements = await runAllMonthlySettlements(targetMonth, 'system-cron');

    return NextResponse.json({
      success: true,
      month: targetMonth,
      count: settlements.length,
      settlements,
      message: `Successfully executed monthly settlement cron for ${targetMonth}.`,
    });
  } catch (error: any) {
    console.error('[Vercel Cron] Error running monthly settlement cron:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to execute monthly settlement cron.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/monthly-settlement
 * Supports manual POST webhook trigger with Bearer token.
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
