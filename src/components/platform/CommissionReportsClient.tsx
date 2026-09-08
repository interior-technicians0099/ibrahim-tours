'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ArrowLeft,
  Calendar,
  DollarSign,
  Download,
  Info,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export interface MonthlyReportRow {
  month: string;
  totalBookings: number;
  revenueCents: number;
  costCents: number;
  profitCents: number;
  commissionRate: number | null;
  commissionDueCents: number;
  operatorNetEarningsCents: number;
  settlementStatus: string;
  isPendingRate: boolean;
}

interface Props {
  reportRows: MonthlyReportRow[];
  userRole: string;
}

export default function CommissionReportsClient({ reportRows, userRole }: Props) {
  const isOperator = userRole === 'OPERATOR';

  // Export Report to CSV
  const handleExportCsv = () => {
    const headers = [
      'Month',
      'Completed Tours',
      'Gross Revenue ($)',
      'Direct Costs ($)',
      'Gross Profit ($)',
      'Commission Rate (%)',
      'Platform Commission Due ($)',
      'Operator Net Payout ($)',
      'Settlement Status',
    ];

    const rows = reportRows.map((r) => [
      r.month,
      r.totalBookings,
      (r.revenueCents / 100).toFixed(2),
      (r.costCents / 100).toFixed(2),
      (r.profitCents / 100).toFixed(2),
      r.commissionRate !== null ? r.commissionRate : 'Pending Rate',
      (r.commissionDueCents / 100).toFixed(2),
      (r.operatorNetEarningsCents / 100).toFixed(2),
      r.settlementStatus,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `commission-reports-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href={isOperator ? '/operator' : '/platform'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Monthly Commission & Revenue Reports</h1>
            <p className="text-xs text-slate-400">
              Shared transparency report for platform oversight and operator settlement auditing
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export CSV</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        
        {/* Transparency Banner */}
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Transparent Profit-Sharing Ledger</strong>
            <span>
              Commission is calculated strictly on net profit (Total Revenue minus direct vehicle & guide costs).
              Both platform administration and operator view identical figures to prevent settlement disputes.
            </span>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4 text-center">Completed</th>
                  <th className="py-3.5 px-4 text-right">Gross Revenue</th>
                  <th className="py-3.5 px-4 text-right text-slate-500">Direct Cost</th>
                  <th className="py-3.5 px-4 text-right text-teal-400">Gross Profit</th>
                  <th className="py-3.5 px-4 text-right">Commission Rate</th>
                  <th className="py-3.5 px-4 text-right text-indigo-400">Platform Commission</th>
                  <th className="py-3.5 px-4 text-right text-emerald-400">Operator Net</th>
                  <th className="py-3.5 px-4 text-center">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reportRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 text-sm">
                      No monthly booking reports recorded yet.
                    </td>
                  </tr>
                ) : (
                  reportRows.map((r) => (
                    <tr key={r.month} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{r.month}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold whitespace-nowrap">
                        {r.totalBookings}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-white whitespace-nowrap">
                        {formatPrice(Math.round(r.revenueCents / 100))}
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-400 whitespace-nowrap">
                        {formatPrice(Math.round(r.costCents / 100))}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-teal-400 whitespace-nowrap">
                        {formatPrice(Math.round(r.profitCents / 100))}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {r.commissionRate !== null ? (
                          <span className="font-semibold text-slate-300">{r.commissionRate}%</span>
                        ) : (
                          <span className="text-amber-400 italic text-[11px]">Pending Rate</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-indigo-400 whitespace-nowrap">
                        {formatPrice(Math.round(r.commissionDueCents / 100))}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-emerald-400 whitespace-nowrap text-sm">
                        {formatPrice(Math.round(r.operatorNetEarningsCents / 100))}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            r.settlementStatus === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : r.settlementStatus === 'SETTLED'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {r.settlementStatus}
                        </span>
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
