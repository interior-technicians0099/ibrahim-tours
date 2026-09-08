import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';

/**
 * GET /api/platform/bookings
 * Programmatic master bookings API for Platform Admin.
 * Returns all bookings with full confidential financials (costCents, profitCents, commissionAmountCents)
 * and payment ledger history.
 * Strictly forbidden to unauthenticated users and operators.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    if (user.role !== Role.PLATFORM_ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden: Platform admin role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const operatorId = searchParams.get('operatorId');

    const bookings = await prisma.booking.findMany({
      where: {
        ...(status && status !== 'ALL' ? { status: status as any } : {}),
        ...(paymentStatus && paymentStatus !== 'ALL' ? { paymentStatus: paymentStatus as any } : {}),
        ...(operatorId && operatorId !== 'ALL' ? { operatorId } : {}),
      },
      include: {
        tour: true,
        transportService: true,
        route: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          include: {
            recordedBy: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error: any) {
    console.error('Error in GET /api/platform/bookings:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch platform bookings.' },
      { status: 500 }
    );
  }
}
