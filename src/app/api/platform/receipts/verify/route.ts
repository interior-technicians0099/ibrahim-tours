import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { verifyReceiptCode } from '@/lib/services/receipt-service';

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.PLATFORM_ADMIN, Role.COMPANY_ADMIN]);

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code') || '';

    if (!code.trim()) {
      return NextResponse.json(
        { isValid: false, reason: 'Please enter a 6-character code or receipt number.' },
        { status: 400 }
      );
    }

    const result = await verifyReceiptCode(code);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error verifying receipt code:', error);
    return NextResponse.json(
      { isValid: false, reason: error?.message || 'Verification service error.' },
      { status: error?.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
