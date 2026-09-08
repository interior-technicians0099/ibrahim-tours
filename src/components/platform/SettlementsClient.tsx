'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  X,
  RefreshCw,
  Eye,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { SettlementStatus } from '@prisma/client';
import PlatformNav from '@/components/platform/PlatformNav';
import { exportToCsv } from '@/lib/export-csv';

export interface SettlementItem {
  id: string;
  operatorId: string;
  operatorName: string;
  month: string;
  totalBookings: number;
  totalRevenueCents: number;
  totalProfitCents: number;
  commissionRate: number | null;
  commissionDueCents: number;
  status: SettlementStatus;
  settledAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ContributingBookingItem {
  id: string;
  operatorId?: string | null;
  month?: string;
  referenceCode: string;
  serviceTitle: string;
  customerName: string;
  bookingDate: string;
  amountPaidCents: number;
  profitCents: number;
  commissionAmountCents: number | null;
}

interface Props {
  initialSettlements: SettlementItem[];
  allBookings: ContributingBookingItem[];
}

export default function SettlementsClient({ initialSettlements, allBookings }: Props) {
  const [settlements, setSettlements] = useState<SettlementItem[]>(initialSettlements);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeDrillSettlement, setActiveDrillSettlement] = useState<SettlementItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtered settlements
  const filteredSettlements = settlements.filter(
    (s) => statusFilter === 'ALL' || s.status === statusFilter
  );

  // Status transition handler
  const handleStatusTransition = async (settlementId: string, newStatus: SettlementStatus) => {
    setIsUpdatingStatus(settlementId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/platform/settlements/${settlementId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to update settlement status.');
        setIsUpdatingStatus(null);
        return;
      }

      setSettlements((prev) =>
        prev.map((s) =>
          s.id === settlementId
            ? { ...s, status: newStatus, settledAt: new Date().toISOString() }
            : s
        )
      );
      setSuccessMsg(`Settlement marked as ${newStatus}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error updating settlement.');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Run on-demand calculation
  const handleTriggerRun = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const res = await fetch('/api/platform/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonth }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to generate settlements.');
        setIsGenerating(false);
        return;
      }

      // Re-fetch settlements list
      const listRes = await fetch('/api/platform/settlements');
      const listData = await listRes.json();
      if (listData.success) {
        setSettlements(listData.settlements);
      }

      setSuccessMsg(`Settlement rollup generated for ${currentMonth}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to trigger settlement run.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export Settlements CSV
  const handleExportCsv = () => {
    exportToCsv(
      `monthly-settlements-${new Date().toISOString().slice(0, 10)}`,
      filteredSettlements,
      [
        { header: 'Period', key: 'month' },
        { header: 'Operator Name', key: 'operatorName' },
        { header: 'Total Bookings', key: 'totalBookings' },
        {
          header: 'Gross Revenue ($)',
          key: 'totalRevenueCents',
          formatter: (cents) => (cents / 100).toFixed(2),
        },
        {
          header: 'Gross Profit ($)',
          key: 'totalProfitCents',
          formatter: (cents) => (cents / 100).toFixed(2),
        },
        {
          header: 'Commission Rate (%)',
          key: 'commissionRate',
          formatter: (rate) => (rate !== null && rate !== undefined ? `${rate}%` : 'TBD'),
        },
        {
          header: 'Commission Due ($)',
          key: 'commissionDueCents',
          formatter: (cents) => (cents / 100).toFixed(2),
        },
        {
          header: 'Operator Payout ($)',
          key: 'totalProfitCents',
          formatter: (_, row) => ((row.totalProfitCents - row.commissionDueCents) / 100).toFixed(2),
        },
        { header: 'Status', key: 'status' },
        {
          header: 'Settled At',
          key: 'settledAt',
          formatter: (val) => (val ? new Date(val).toLocaleDateString() : '—'),
        },
        { header: 'Notes', key: 'notes', formatter: (val) => val || '' },
      ]
    );
  };

  // Contributing bookings filtered to the currently drilled settlement
  const currentDrillBookings = activeDrillSettlement
    ? allBookings.filter((b) => {
        const matchesMonth = !b.month || b.month === activeDrillSettlement.month;
        const matchesOp =
          !b.operatorId || !activeDrillSettlement.operatorId || b.operatorId === activeDrillSettlement.operatorId;
        return matchesMonth && matchesOp;
      })
    : [];

  // Export specific statement for active drilled settlement
  const handleExportStatement = (settlement: SettlementItem) => {
    const drillBookings = allBookings.filter((b) => {
      const matchesMonth = !b.month || b.month === settlement.month;
      const matchesOp =
        !b.operatorId || !settlement.operatorId || b.operatorId === settlement.operatorId;
      return matchesMonth && matchesOp;
    });

    exportToCsv(
      `statement-${settlement.month}-${settlement.operatorName.replace(/\s+/g, '-').toLowerCase()}`,
      drillBookings,
      [
        { header: 'Booking Ref', key: 'referenceCode' },
        { header: 'Guest Name', key: 'customerName' },
        { header: 'Service Title', key: 'serviceTitle' },
        { header: 'Date', key: 'bookingDate' },
        {
          header: 'Amount Paid ($)',
          key: 'amountPaidCents',
          formatter: (cents) => (cents / 100).toFixed(2),
        },
        {
          header: 'Gross Profit ($)',
          key: 'profitCents',
          formatter: (cents) => (cents / 100).toFixed(2),
        },
        {
          header: 'Platform Commission ($)',
          key: 'commissionAmountCents',
          formatter: (cents) => (cents !== null && cents !== undefined ? (cents / 100).toFixed(2) : 'TBD'),
        },
      ]
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Unified Platform Navigation */}
      <PlatformNav />

      {/* Subheader Toolbar */}
      <div className="bg-slate-900/40 border-b border-slate-800/80 px-4 sm:px-8 py-4 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <span>Monthly Commission Settlements</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold">
                Dual-Party Transparency
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated monthly operator settlements, profit shares, and verified bank/M-Pesa payout states
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleTriggerRun}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Run Current Month Rollup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Filters and Counters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {['ALL', 'PENDING', 'SETTLED', 'PAID'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-semibold">
            {filteredSettlements.length} Settlements Listed
          </span>
        </div>

        {/* Settlements Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4 text-center">Completed Tours</th>
                  <th className="py-3.5 px-4 text-right">Revenue</th>
                  <th className="py-3.5 px-4 text-right text-teal-400">Profit</th>
                  <th className="py-3.5 px-4 text-right">Commission Rate</th>
                  <th className="py-3.5 px-4 text-right text-indigo-400">Due to Platform</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSettlements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 text-sm">
                      No monthly settlements found. Click &quot;Run Current Month Rollup&quot; to calculate.
                    </td>
                  </tr>
                ) : (
                  filteredSettlements.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{s.month}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-200 whitespace-nowrap">
                        {s.operatorName}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveDrillSettlement(s)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
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
                          <span className="text-amber-400 italic text-[11px]">Pending Rate</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-indigo-400 whitespace-nowrap text-sm">
                        {formatPrice(Math.round(s.commissionDueCents / 100))}
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
                          {s.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.status === 'PENDING' && (
                            <button
                              type="button"
                              disabled={isUpdatingStatus === s.id}
                              onClick={() => handleStatusTransition(s.id, SettlementStatus.SETTLED)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-colors disabled:opacity-50"
                            >
                              Mark Settled
                            </button>
                          )}

                          {s.status === 'SETTLED' && (
                            <button
                              type="button"
                              disabled={isUpdatingStatus === s.id}
                              onClick={() => handleStatusTransition(s.id, SettlementStatus.PAID)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors disabled:opacity-50"
                            >
                              Mark Paid
                            </button>
                          )}

                          {s.status === 'PAID' && (
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Finalized</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Drill-down Modal into Contributing Bookings */}
      {activeDrillSettlement && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  Settlement Statement & Transparency Breakdown
                </span>
                <h3 className="text-lg font-bold text-white">
                  Period: {activeDrillSettlement.month} — {activeDrillSettlement.operatorName}
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
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Revenue</span>
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
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Operator Net</span>
                <span className="text-base font-bold text-emerald-400">
                  {formatPrice(
                    Math.round(
                      (activeDrillSettlement.totalProfitCents - activeDrillSettlement.commissionDueCents) / 100
                    )
                  )}
                </span>
              </div>
            </div>

            {/* Contributing Bookings List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Itemized Contributing Completed Bookings ({currentDrillBookings.length})
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
                    No individual booking line items recorded for this specific month.
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
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
