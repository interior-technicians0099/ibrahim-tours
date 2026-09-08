'use client';

import React from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Receipt,
  Scale,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sliders,
  Users,
} from 'lucide-react';
import { BookingStatus, PaymentStatus, CommissionStatus } from '@prisma/client';
import PlatformNav from '@/components/platform/PlatformNav';

export interface RecentBookingItem {
  id: string;
  referenceCode: string;
  serviceTitle: string;
  customerName: string;
  operatorName: string;
  bookingDate: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  amountPaidCents: number;
  totalPriceCents: number;
  profitCents: number | null;
  commissionAmountCents: number | null;
  commissionStatus: CommissionStatus | null;
}

export interface PlatformOverviewData {
  currentMonth: string;
  bookingsThisMonth: number;
  revenueThisMonthCents: number;
  profitThisMonthCents: number;
  commissionThisMonthCents: number;
  pendingSettlementsDueCents: number;
  pendingRateCount: number;
  missingCostCount: number;
  unpaidCompletedCount: number;
  pendingSettlementsCount: number;
  globalRate: number | null;
  recentBookings: RecentBookingItem[];
}

interface Props {
  adminName: string;
  adminEmail: string;
  data: PlatformOverviewData;
}

export default function PlatformDashboardClient({ adminName, adminEmail, data }: Props) {
  const totalCommissionDueCents =
    data.commissionThisMonthCents + data.pendingSettlementsDueCents;

  const totalAlertsCount =
    data.unpaidCompletedCount +
    data.missingCostCount +
    data.pendingRateCount +
    data.pendingSettlementsCount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <PlatformNav adminName={adminName} adminEmail={adminEmail} />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Welcome & Top Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Platform Executive Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time revenue metrics, commission accounting, and operations control for month{' '}
              <span className="font-mono text-indigo-400 font-semibold">{data.currentMonth}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/platform/reconciliation"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
            >
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Reconciliation Engine</span>
            </Link>

            <Link
              href="/platform/settlements"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
            >
              <Receipt className="w-4 h-4" />
              <span>Settlements & Payouts</span>
            </Link>
          </div>
        </div>

        {/* 1. Alerts Panel (if discrepancies or action required) */}
        {totalAlertsCount > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Action Required: Financial & Operational Discrepancies</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {totalAlertsCount} ALERT{totalAlertsCount > 1 ? 'S' : ''}
                    </span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
                  {data.unpaidCompletedCount > 0 && (
                    <Link
                      href="/platform/reconciliation"
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-bold text-amber-300">
                          {data.unpaidCompletedCount} Completed
                        </span>
                        <p className="text-[11px] text-slate-400">Incomplete payment</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                    </Link>
                  )}

                  {data.missingCostCount > 0 && (
                    <Link
                      href="/platform/reconciliation"
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-bold text-rose-400">
                          {data.missingCostCount} Missing Cost
                        </span>
                        <p className="text-[11px] text-slate-400">Excluded from settlements</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
                    </Link>
                  )}

                  {data.pendingRateCount > 0 && (
                    <Link
                      href="/platform/settings"
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-bold text-indigo-300">
                          {data.pendingRateCount} Pending Rate
                        </span>
                        <p className="text-[11px] text-slate-400">Awaiting commission rate</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </Link>
                  )}

                  {data.pendingSettlementsCount > 0 && (
                    <Link
                      href="/platform/settlements"
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-bold text-emerald-300">
                          {data.pendingSettlementsCount} Settlements
                        </span>
                        <p className="text-[11px] text-slate-400">Awaiting review & payout</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Bookings This Month */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Excursions Delivered
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">{data.bookingsThisMonth}</span>
              <p className="text-[11px] text-slate-400 mt-1">Service month {data.currentMonth}</p>
            </div>
          </div>

          {/* Card 2: Gross Revenue */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Gross Revenue Recorded
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">
                ${(data.revenueThisMonthCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Cash, M-Pesa & Bank transfers</p>
            </div>
          </div>

          {/* Card 3: Gross Profit */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Gross Profit (Rev − Cost)
              </span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">
                ${(data.profitThisMonthCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Commissionable profit base</p>
            </div>
          </div>

          {/* Card 4: Platform Commission Due */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Commission Due
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-amber-300">
                ${(totalCommissionDueCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                <span>Rate: {data.globalRate !== null ? `${data.globalRate}%` : 'TBD'}</span>
                <span>•</span>
                <span>${(data.commissionThisMonthCents / 100).toFixed(0)} this mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Quick Navigation Hub */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/platform/bookings"
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:bg-slate-900 hover:border-slate-700 transition-all flex items-center gap-3 shadow-lg group"
          >
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Bookings Master</h4>
              <p className="text-[11px] text-slate-400">All bookings & details</p>
            </div>
          </Link>

          <Link
            href="/platform/reconciliation"
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:bg-slate-900 hover:border-slate-700 transition-all flex items-center gap-3 shadow-lg group"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Reconciliation</h4>
              <p className="text-[11px] text-slate-400">Discrepancies & audits</p>
            </div>
          </Link>

          <Link
            href="/platform/settlements"
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:bg-slate-900 hover:border-slate-700 transition-all flex items-center gap-3 shadow-lg group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Settlements</h4>
              <p className="text-[11px] text-slate-400">Monthly statements & payout</p>
            </div>
          </Link>

          <Link
            href="/platform/operators"
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:bg-slate-900 hover:border-slate-700 transition-all flex items-center gap-3 shadow-lg group"
          >
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Operators & Trust</h4>
              <p className="text-[11px] text-slate-400">Ibrahim profile & TRA license</p>
            </div>
          </Link>
        </div>

        {/* 4. Recent Bookings Across Operators */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Recent Bookings Feed</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                  Newest 10
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Live bookings across operators with payment status and commission snapshot
              </p>
            </div>

            <Link
              href="/platform/bookings"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="pb-3 pr-4">Reference</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Service</th>
                  <th className="pb-3 pr-4">Service Date</th>
                  <th className="pb-3 pr-4 text-right">Quoted Price</th>
                  <th className="pb-3 pr-4 text-right">Amount Paid</th>
                  <th className="pb-3 pr-4 text-center">Payment</th>
                  <th className="pb-3 pr-4 text-center">Status</th>
                  <th className="pb-3 pr-4 text-right">Gross Profit</th>
                  <th className="pb-3 text-right">Commission Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-medium">
                {data.recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      No bookings recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 pr-4 font-mono font-bold text-white">{b.referenceCode}</td>
                      <td className="py-3.5 pr-4 text-slate-200">{b.customerName}</td>
                      <td className="py-3.5 pr-4 max-w-[180px] truncate text-slate-300">{b.serviceTitle}</td>
                      <td className="py-3.5 pr-4 text-slate-400">{b.bookingDate}</td>
                      <td className="py-3.5 pr-4 text-right font-mono text-slate-300">
                        ${(b.totalPriceCents / 100).toFixed(2)}
                      </td>
                      <td className="py-3.5 pr-4 text-right font-mono font-bold text-white">
                        ${(b.amountPaidCents / 100).toFixed(2)}
                      </td>
                      <td className="py-3.5 pr-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.paymentStatus === PaymentStatus.PAID_IN_FULL
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : b.paymentStatus === PaymentStatus.PARTIALLY_PAID
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === BookingStatus.CONFIRMED
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : b.status === BookingStatus.COMPLETED
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-right font-mono text-slate-300">
                        {b.profitCents !== null ? `$${(b.profitCents / 100).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold text-amber-300">
                        {b.commissionAmountCents !== null
                          ? `$${(b.commissionAmountCents / 100).toFixed(2)}`
                          : b.commissionStatus === CommissionStatus.MISSING_COST
                          ? 'Missing Cost'
                          : b.commissionStatus === CommissionStatus.PENDING_RATE
                          ? 'Pending Rate'
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
