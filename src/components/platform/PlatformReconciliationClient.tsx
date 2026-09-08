'use client';

import React, { useState, useMemo } from 'react';
import {
  Scale,
  AlertTriangle,
  Download,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Clock,
  X,
  PlusCircle,
  Save,
} from 'lucide-react';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import PlatformNav from '@/components/platform/PlatformNav';
import { exportToCsv } from '@/lib/export-csv';

export interface ReconciliationItem {
  id: string;
  referenceCode: string;
  serviceTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  operatorName: string;
  bookingDate: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  quotedPriceCents: number;
  amountPaidCents: number;
  costCents: number | null;
  profitCents: number | null;
  anomalies: string[];
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Props {
  initialItems: ReconciliationItem[];
  adminName: string;
  adminEmail: string;
}

export default function PlatformReconciliationClient({
  initialItems,
  adminName,
  adminEmail,
}: Props) {
  const [items, setItems] = useState<ReconciliationItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [costModalBooking, setCostModalBooking] = useState<ReconciliationItem | null>(null);
  const [costInput, setCostInput] = useState('');
  const [costNotes, setCostNotes] = useState('');
  const [isSavingCost, setIsSavingCost] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Categorized counts
  const counts = useMemo(() => {
    return {
      total: items.length,
      high: items.filter((i) => i.severity === 'HIGH').length,
      medium: items.filter((i) => i.severity === 'MEDIUM').length,
      low: items.filter((i) => i.severity === 'LOW').length,
    };
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.referenceCode.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.customerEmail.toLowerCase().includes(q) ||
        item.anomalies.some((a) => a.toLowerCase().includes(q));

      const matchesSeverity = severityFilter === 'ALL' || item.severity === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [items, searchQuery, severityFilter]);

  // Handle Cost Supply
  const handleSaveCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!costModalBooking) return;

    setIsSavingCost(true);
    setErrorMsg(null);

    try {
      const costCents = Math.round(parseFloat(costInput) * 100);
      const res = await fetch(`/api/platform/bookings/${costModalBooking.id}/cost`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ costCents, notes: costNotes }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to update cost.');
        setIsSavingCost(false);
        return;
      }

      // Update local state
      setItems((prev) =>
        prev
          .map((i) => {
            if (i.id === costModalBooking.id) {
              const updatedAnomalies = i.anomalies.filter((a) => !a.includes('Operating cost'));
              return {
                ...i,
                costCents,
                profitCents: data.booking.profitCents,
                anomalies: updatedAnomalies,
                severity: updatedAnomalies.length > 0 ? i.severity : 'LOW',
              };
            }
            return i;
          })
          .filter((i) => i.anomalies.length > 0)
      );

      setSuccessMsg(`Cost supplied for ${costModalBooking.referenceCode}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setCostModalBooking(null);
      setCostInput('');
      setCostNotes('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error saving cost.');
    } finally {
      setIsSavingCost(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    exportToCsv(
      `reconciliation_anomalies_${new Date().toISOString().slice(0, 10)}.csv`,
      filteredItems,
      [
        { header: 'Reference', key: 'referenceCode' },
        { header: 'Customer', key: 'customerName' },
        { header: 'Phone', key: 'customerPhone' },
        { header: 'Email', key: 'customerEmail' },
        { header: 'Service Title', key: 'serviceTitle' },
        { header: 'Service Date', key: 'bookingDate' },
        { header: 'Booking Status', key: 'status' },
        { header: 'Payment Status', key: 'paymentStatus' },
        {
          header: 'Quoted Price (USD)',
          key: 'quotedPriceCents',
          formatter: (v) => (v / 100).toFixed(2),
        },
        {
          header: 'Amount Paid (USD)',
          key: 'amountPaidCents',
          formatter: (v) => (v / 100).toFixed(2),
        },
        {
          header: 'Cost (USD)',
          key: 'costCents',
          formatter: (v) => (v !== null ? (v / 100).toFixed(2) : 'MISSING'),
        },
        {
          header: 'Profit (USD)',
          key: 'profitCents',
          formatter: (v) => (v !== null ? (v / 100).toFixed(2) : 'N/A'),
        },
        { header: 'Severity', key: 'severity' },
        {
          header: 'Detected Anomalies',
          key: 'anomalies',
          formatter: (v) => v.join('; '),
        },
      ]
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <PlatformNav adminName={adminName} adminEmail={adminEmail} />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Header & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Scale className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Financial Reconciliation Engine
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Cross-checks, payment mismatches, uncompleted historical excursions, and missing costs
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={filteredItems.length === 0}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-md self-start sm:self-auto disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Reconciliation CSV ({filteredItems.length})</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Anomaly Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setSeverityFilter('ALL')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              severityFilter === 'ALL'
                ? 'bg-slate-900 border-indigo-500 shadow-lg'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Total Anomalies
            </span>
            <div className="text-2xl font-black text-white mt-1">{counts.total}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Across active bookings</p>
          </button>

          <button
            onClick={() => setSeverityFilter('HIGH')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              severityFilter === 'HIGH'
                ? 'bg-rose-950/40 border-rose-500 shadow-lg'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-xs text-rose-400 font-semibold uppercase tracking-wider">
              High Severity
            </span>
            <div className="text-2xl font-black text-rose-300 mt-1">{counts.high}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Completed unpaid / overdue tours</p>
          </button>

          <button
            onClick={() => setSeverityFilter('MEDIUM')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              severityFilter === 'MEDIUM'
                ? 'bg-amber-950/40 border-amber-500 shadow-lg'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              Medium Severity
            </span>
            <div className="text-2xl font-black text-amber-300 mt-1">{counts.medium}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Price discrepancies & missing costs</p>
          </button>

          <button
            onClick={() => setSeverityFilter('LOW')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              severityFilter === 'LOW'
                ? 'bg-sky-950/40 border-sky-500 shadow-lg'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-xs text-sky-400 font-semibold uppercase tracking-wider">
              Minor Notes
            </span>
            <div className="text-2xl font-black text-sky-300 mt-1">{counts.low}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Overpayments or advisory notices</p>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, guest name, email, or anomaly description..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Anomalies Table */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 pb-3">
                <tr>
                  <th className="pb-3 pr-4">Reference</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Service Date</th>
                  <th className="pb-3 pr-4 text-center">Status</th>
                  <th className="pb-3 pr-4 text-right">Quoted</th>
                  <th className="pb-3 pr-4 text-right">Paid</th>
                  <th className="pb-3 pr-4">Detected Anomalies</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-medium">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                      <div>No reconciliation discrepancies found. All accounts balanced!</div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 pr-4 font-mono font-bold text-white">{item.referenceCode}</td>
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold text-slate-200">{item.customerName}</div>
                        <div className="text-[10px] text-slate-400">{item.customerPhone}</div>
                      </td>
                      <td className="py-3.5 pr-4 text-slate-400">{item.bookingDate}</td>
                      <td className="py-3.5 pr-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === BookingStatus.COMPLETED
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {item.status}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                              item.paymentStatus === PaymentStatus.PAID_IN_FULL
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {item.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-right font-mono text-slate-300">
                        ${(item.quotedPriceCents / 100).toFixed(2)}
                      </td>
                      <td className="py-3.5 pr-4 text-right font-mono font-bold text-white">
                        ${(item.amountPaidCents / 100).toFixed(2)}
                      </td>
                      <td className="py-3.5 pr-4">
                        <ul className="space-y-1">
                          {item.anomalies.map((a, idx) => (
                            <li
                              key={idx}
                              className={`text-[11px] flex items-center gap-1.5 font-medium ${
                                item.severity === 'HIGH'
                                  ? 'text-rose-300'
                                  : item.severity === 'MEDIUM'
                                  ? 'text-amber-300'
                                  : 'text-sky-300'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3.5 text-center">
                        {item.anomalies.some((a) => a.includes('Operating cost')) && (
                          <button
                            onClick={() => {
                              setCostModalBooking(item);
                              setCostInput('');
                              setCostNotes('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 mx-auto"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Supply Cost</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Supply Cost Modal */}
      {costModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                <span>Supply Operating Cost for {costModalBooking.referenceCode}</span>
              </h3>
              <button
                onClick={() => setCostModalBooking(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Operator Cost in USD ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costInput}
                    onChange={(e) => setCostInput(e.target.value)}
                    placeholder="e.g. 60.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Amount paid by customer: ${(costModalBooking.amountPaidCents / 100).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Override Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={costNotes}
                  onChange={(e) => setCostNotes(e.target.value)}
                  placeholder="e.g. Verified with Ibrahim: boat fuel + marine park fee"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCostModalBooking(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCost}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingCost ? 'Saving...' : 'Save & Recalculate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
