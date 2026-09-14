import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { updateReceiptNotes } from '@/lib/services/receipt-service';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole([Role.PLATFORM_ADMIN, Role.COMPANY_ADMIN]);
    const { id } = await context.params;
    const body = await request.json();
    const notes = typeof body?.notes === 'string' ? body.notes : '';

    const updated = await updateReceiptNotes(id, notes, user.id);
    return NextResponse.json({ success: true, receipt: updated });
  } catch (error: any) {
    console.error('Error updating receipt notes:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update receipt notes.' },
      { status: 400 }
    );
  }
}
