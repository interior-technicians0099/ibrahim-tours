import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { markBookingCheckedIn } from '@/lib/services/receipt-service';

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN, Role.COMPANY_ADMIN]);
    const body = await request.json();
    const code = body?.code;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Verification code is required.' },
        { status: 400 }
      );
    }

    const result = await markBookingCheckedIn(code, user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error checking in booking:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Check-in failed.' },
      { status: 400 }
    );
  }
}
