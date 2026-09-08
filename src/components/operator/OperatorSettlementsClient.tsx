'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Calendar,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  ArrowLeft,
  X,
  Compass,
  Car,
  Layers,
  Star,
  HelpCircle,
  User,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { SettlementStatus } from '@prisma/client';
import LogoutButton from '@/components/auth/LogoutButton';
import { exportToCsv } from '@/lib/export-csv';

export interface OperatorSettlementItem {
  id: string;
  month: string;
  totalBookings: number;
  totalRevenueCents: number;
  totalProfitCents: number;
  commissionRate: number | null;
  commissionDueCents: number;
  netPayoutCents: number;
  status: SettlementStatus;
  settledAt: string | null;
  notes: string | null;
}

export interface OperatorContributingBooking {
  id: string;
  month: string;
  referenceCode: string;
  serviceTitle: string;
  customerName: string;
  bookingDate: string;
  amountPaidCents: number;
  profitCents: number;
}

interface Props {
  initialSettlements: OperatorSettlementItem[];
  contributingBookings: OperatorContributingBooking[];
  operatorName: string;
}

export default function OperatorSettlementsClient({
  initialSettlements,
  contributingBookings,
  operatorName,
}: Props) {
  const [settlements] = useState<OperatorSettlementItem[]>(initialSettlements);
  const [activeDrillSettlement, setActiveDrillSettlement] =
    useState<OperatorSettlementItem | null>(null);

  // Overall Financial Rollups
  const totalPaidRevenueCents = settlements.reduce((acc, s) => acc + s.totalRevenueCents, 0);
  const totalNetEarningsCents = settlements.reduce((acc, s) => acc + s.netPayoutCents, 0);
  const totalCommissionSharedCents = settlements.reduce((acc, s) => acc + s.commissionDueCents, 0);

  // Export Settlements List
  const handleExportList = () => {
    exportToCsv(
      `ibrahim-tours-settlements-${new Date().toISOString().slice(0, 10)}`,
      settlements,
      [
        { header: 'Period', key: 'month' },
        { header: 'Completed Tours', key: 'totalBookings' },
        {
          header: 'Gross Revenue ($)',
          key: 'totalRevenueCents',
          formatter: (val) => (val / 100).toFixed(2),
        },
        {
          header: 'Gross Profit ($)',
          key: 'totalProfitCents',
          formatter: (val) => (val / 100).toFixed(2),
        },
        {
          header: 'Agreed Commission Rate (%)',
          key: 'commissionRate',
          formatter: (val) => (val !== null ? `${val}%` : 'TBD'),
        },
        {
          header: 'Platform Commission ($)',
          key: 'commissionDueCents',
          formatter: (val) => (val / 100).toFixed(2),
        },
        {
          header: 'Operator Net Payout ($)',
          key: 'netPayoutCents',
          formatter: (val) => (val / 100).toFixed(2),
        },
        { header: 'Status', key: 'status' },
        {
          header: 'Settled At',
          key: 'settledAt',
          formatter: (val) => (val ? new Date(val).toLocaleDateString() : '—'),
        },
      ]
    );
  };

  // Export specific drilled statement
  const handleExportStatement = (settlement: OperatorSettlementItem) => {
    const drillBookings = contributingBookings.filter((b) => b.month === settlement.month);

    exportToCsv(
      `statement-${settlement.month}-ibrahim-tours`,
      drillBookings,
      [
        { header: 'Booking Ref', key: 'referenceCode' },
        { header: 'Guest Name', key: 'customerName' },
        { header: 'Excursion / Transfer', key: 'serviceTitle' },
        { header: 'Date', key: 'bookingDate' },
        {
          header: 'Amount Collected ($)',
          key: 'amountPaidCents',
          formatter: (cents) => (cents / 100).toFixed(2),
        },
        {
          header: 'Gross Profit ($)',
          key: 'profitCents',
          formatter: (cents) => (cents / 100).toFixed(2),
        },
      ]
    );
  };

  const currentDrillBookings = activeDrillSettlement
    ? contributingBookings.filter((b) => b.month === activeDrillSettlement.month)
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* 1. Header Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-white">
                {operatorName}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Operator Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Monthly Settlement Statements & Commercial Transparency
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="text-xs text-slate-400 hover:text-white hidden sm:flex items-center gap-1 transition-colors"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <LogoutButton />
        </div>
      </header>

      {/* 2. Navigation Tabs */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-2 py-2">
          <Link
            href="/operator"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span>Bookings & Ledger</span>
          </Link>
          <Link
            href="/operator/tours"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Manage Tours</span>
          </Link>
          <Link
            href="/operator/transport"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Car className="w-3.5 h-3.5" />
            <span>Transfers & Fleet</span>
          </Link>
          <Link
            href="/operator/categories"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Categories</span>
          </Link>
          <Link
            href="/operator/reviews"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Star className="w-3.5 h-3.5" />
            <span>Reviews</span>
          </Link>
          <Link
            href="/operator/faqs"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQs</span>
          </Link>
          <Link
            href="/operator/profile"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Payment</span>
          </Link>
          <Link
            href="/operator/settlements"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Settlements & Statements</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Transparency Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Dual-Party Accounting Transparency</h2>
              <p className="text-xs text-slate-400">
                Every calculation shown here is mathematically identical to the Platform Admin record. No hidden deductions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportList}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Statements History</span>
          </button>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Cumulative Gross Revenue
            </span>
            <div className="text-2xl font-black text-white">
              {formatPrice(Math.round(totalPaidRevenueCents / 100))}
            </div>
            <p className="text-[11px] text-slate-500">Total payments collected from verified tourists</p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-1">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              Your Net Operator Earnings
            </span>
            <div className="text-2xl font-black text-emerald-400">
              {formatPrice(Math.round(totalNetEarningsCents / 100))}
            </div>
            <p className="text-[11px] text-slate-500">Gross profit retained after platform commission</p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-1">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
              Platform Tech Commission
            </span>
            <div className="text-2xl font-black text-indigo-400">
              {formatPrice(Math.round(totalCommissionSharedCents / 100))}
            </div>
            <p className="text-[11px] text-slate-500">Agreed share for web infrastructure & bookings engine</p>
          </div>
        </div>

        {/* Statements Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Monthly Settlement Statements
              </h3>
              <p className="text-xs text-slate-400">
                Itemized monthly rollups for accounting, M-Pesa settlements, and tax reporting
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {settlements.length} Monthly Periods
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4 text-center">Tours Delivered</th>
                  <th className="py-3.5 px-4 text-right">Gross Collected</th>
                  <th className="py-3.5 px-4 text-right text-teal-400">Operating Profit</th>
                  <th className="py-3.5 px-4 text-right">Commission Rate</th>
                  <th className="py-3.5 px-4 text-right text-indigo-400">Platform Share</th>
                  <th className="py-3.5 px-4 text-right text-emerald-400">Your Net Payout</th>
                  <th className="py-3.5 px-4 text-center">Settlement Status</th>
                  <th className="py-3.5 px-4 text-right">Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {settlements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 text-sm">
                      No monthly settlement statements available yet. Statements are generated at month-end.
                    </td>
                  </tr>
                ) : (
                  settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{s.month}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveDrillSettlement(s)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{s.totalBookings} Tours</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-white whitespace-nowrap">
                        {formatPrice(Math.round(s.totalRevenueCents / 100))}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-teal-400 whitespace-nowrap">
                        {formatPrice(Math.round(s.totalProfitCents / 100))}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {s.commissionRate !== null ? (
                          <span className="font-semibold text-slate-300">{s.commissionRate}%</span>
                        ) : (
                          <span className="text-amber-400 italic text-[11px]">TBD (Pending Rate)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-indigo-400 whitespace-nowrap">
                        {formatPrice(Math.round(s.commissionDueCents / 100))}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-emerald-400 whitespace-nowrap text-sm">
                        {formatPrice(Math.round(s.netPayoutCents / 100))}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            s.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : s.status === 'SETTLED'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {s.status === 'PAID'
                            ? 'Paid / Disbursed'
                            : s.status === 'SETTLED'
                            ? 'Approved & Finalized'
                            : 'Pending Month End'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleExportStatement(s)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold inline-flex items-center gap-1 transition-colors border border-slate-700"
                        >
                          <Download className="w-3 h-3 text-emerald-400" />
                          <span>CSV</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Drill-down Modal into Contributing Excursions */}
      {activeDrillSettlement && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Detailed Excursion Statement
                </span>
                <h3 className="text-lg font-bold text-white">
                  Period: {activeDrillSettlement.month} — {operatorName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrillSettlement(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Collected</span>
                <span className="text-base font-bold text-white">
                  {formatPrice(Math.round(activeDrillSettlement.totalRevenueCents / 100))}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Profit</span>
                <span className="text-base font-bold text-teal-400">
                  {formatPrice(Math.round(activeDrillSettlement.totalProfitCents / 100))}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Platform Due</span>
                <span className="text-base font-bold text-indigo-400">
                  {formatPrice(Math.round(activeDrillSettlement.commissionDueCents / 100))}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Your Net Payout</span>
                <span className="text-base font-bold text-emerald-400">
                  {formatPrice(Math.round(activeDrillSettlement.netPayoutCents / 100))}
                </span>
              </div>
            </div>

            {/* Contributing Bookings List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Contributing Delivered Tours ({currentDrillBookings.length})
                </h4>
                <button
                  type="button"
                  onClick={() => handleExportStatement(activeDrillSettlement)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1 transition-colors border border-slate-700"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Statement CSV</span>
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-2xl divide-y divide-slate-800/80">
                {currentDrillBookings.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    No individual tours recorded for this period.
                  </div>
                ) : (
                  currentDrillBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-slate-800/30"
                    >
                      <div>
                        <div className="font-mono font-bold text-white">{b.referenceCode}</div>
                        <div className="text-[11px] text-slate-400">
                          {b.customerName} • {b.serviceTitle}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-white">
                          {formatPrice(Math.round(b.amountPaidCents / 100))}
                        </div>
                        <div className="text-[10px] text-teal-400">
                          Profit: {formatPrice(Math.round(b.profitCents / 100))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <div className="text-xs text-slate-400">
                Status:{' '}
                <span className="font-bold text-white uppercase">{activeDrillSettlement.status}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrillSettlement(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
