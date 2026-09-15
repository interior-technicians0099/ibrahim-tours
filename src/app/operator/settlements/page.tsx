import React from 'react';
import Link from 'next/link';
import { requireRole, getScopedOperatorId } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role, BookingStatus, PaymentStatus } from '@prisma/client';
import { Lock, ArrowLeft } from 'lucide-react';
import OperatorNav from '@/components/operator/OperatorNav';
import OperatorSettlementsClient, {
  OperatorSettlementItem,
  OperatorContributingBooking,
} from '@/components/operator/OperatorSettlementsClient';

export const metadata = {
  title: 'Monthly Settlements & Statements | Zansafari Horizon Admin',
  description: 'Dual-party accounting transparency and platform commission reconciliation ledger.',
};

export default async function OperatorSettlementsPage() {
  const user = await requireRole([Role.OPERATOR, Role.PLATFORM_ADMIN, Role.COMPANY_ADMIN]);
  const scopedOperatorId = await getScopedOperatorId();

  // Look up Company profile
  const operator = scopedOperatorId
    ? await prisma.companyProfile.findUnique({ where: { id: scopedOperatorId } })
    : await prisma.companyProfile.findFirst();

  const operatorName = operator?.companyName || operator?.businessName || operator?.name || user.name || 'Zansafari Horizon';
  const effectiveOperatorId = operator?.id || 'operator-ibrahim';

  // Role restriction: Field Operator cannot manage financial settlements
  if (user.role === Role.OPERATOR) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <OperatorNav
          userRole={user.role}
          userEmail={user.email}
          operatorName={operatorName}
        />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Company Admin Only
              </span>
              <h2 className="text-xl font-extrabold text-white">
                Sehemu ya Meneja wa Kampuni
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Taarifa za mikataba ya platform commission, makato, na stakabadhi za kila mwezi (Settlements & Statements) zinasimamiwa na Meneja wa Kampuni (Company Admin). Wewe kama Afisa wa Ugani, unaweza kusimamia bookings na safari.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
              Umeingia kama: <strong className="text-slate-200">{user.email}</strong> (Field Operator)
            </div>
            <Link
              href="/operator"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Rudi Kwenye Bookings & Ledger</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 1. Fetch monthly settlements for this operator
  const rawSettlements = await prisma.monthlySettlement.findMany({
    where: { operatorId: effectiveOperatorId },
    orderBy: { month: 'desc' },
  });

  const formattedSettlements: OperatorSettlementItem[] = rawSettlements.map((s: any) => {
    const totalRev = Number(s.totalRevenueCents);
    const totalProf = Number(s.totalProfitCents);
    const commDue = Number(s.commissionDueCents);
    return {
      id: s.id,
      month: s.month,
      totalBookings: s.totalBookings,
      totalRevenueCents: totalRev,
      totalProfitCents: totalProf,
      commissionRate: s.commissionRate ? Number(s.commissionRate) * 100 : null,
      commissionDueCents: commDue,
      netPayoutCents: totalProf - commDue,
      status: s.status,
      settledAt: s.settledAt ? s.settledAt.toISOString() : null,
      notes: s.notes,
    };
  });

  // 2. Fetch contributing completed bookings for drilldown breakdown
  const rawCompleted = await prisma.booking.findMany({
    where: {
      operatorId: effectiveOperatorId,
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID_IN_FULL,
    },
    include: {
      tour: true,
      transportService: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const formattedBookings: OperatorContributingBooking[] = rawCompleted.map((b) => ({
    id: b.id,
    month: b.bookingDate
      ? new Date(b.bookingDate).toISOString().slice(0, 7)
      : b.createdAt.toISOString().slice(0, 7),
    referenceCode: b.referenceCode,
    serviceTitle:
      b.serviceType === 'TOUR'
        ? b.tour?.title || 'Zanzibar Tour'
        : `${b.pickupLocation || 'Pickup'} → ${b.dropoffLocation || 'Drop-off'}`,
    customerName: b.customerName,
    bookingDate: new Date(b.bookingDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    amountPaidCents: b.amountPaidCents || 0,
    profitCents: b.profitCents || Math.max(0, (b.amountPaidCents || 0) - (b.costCents || 0)),
  }));

  return (
    <OperatorSettlementsClient
      initialSettlements={formattedSettlements}
      contributingBookings={formattedBookings}
      operatorName={operatorName}
      userRole={user.role}
      userEmail={user.email}
    />
  );
}
