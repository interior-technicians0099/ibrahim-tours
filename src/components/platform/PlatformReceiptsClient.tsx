'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Search,
  Download,
  Filter,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Edit2,
  Save,
  X,
  Copy,
  Check,
  Sparkles,
  Users,
  DollarSign,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { getLanguageBadge } from '@/lib/language-utils';
import UhakikiModal from '@/components/platform/UhakikiModal';

interface ReceiptItem {
  id: string;
  receiptNumber: string;
  verificationCode: string;
  amountCents: number;
  currency: string;
  paymentMethod: string;
  paymentReference: string | null;
  notes: string | null;
  issuedAt: string | Date;
  issuedBy?: { name: string | null; email: string | null } | null;
  booking: {
    id: string;
    referenceCode: string;
    status: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerCountry: string | null;
    locale: string | null;
    bookingDate: string | Date;
    bookingTime: string | null;
    numAdults: number;
    numChildren: number;
    serviceType: string;
    pickupLocation: string | null;
    dropoffLocation: string | null;
    checkedInAt: string | Date | null;
    checkedInBy?: { name: string | null; email: string | null } | null;
    tour?: { title: string } | null;
    guideName?: string | null;
    guidePhone?: string | null;
  };
}

interface Props {
  initialReceipts: ReceiptItem[];
}

export default function PlatformReceiptsClient({ initialReceipts }: Props) {
  const [receipts, setReceipts] = useState<ReceiptItem[]>(initialReceipts);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Uhakiki Modal State
  const [uhakikiOpen, setUhakikiOpen] = useState(false);
  const [activeVerifyCode, setActiveVerifyCode] = useState('');

  // Inline Note Editing State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Month list for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    receipts.forEach((r) => {
      const d = new Date(r.issuedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.add(key);
    });
    return Array.from(months).sort().reverse();
  }, [receipts]);

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNumber = r.receiptNumber.toLowerCase().includes(q);
        const matchCode = r.verificationCode.toLowerCase().includes(q);
        const matchRef = r.booking.referenceCode.toLowerCase().includes(q);
        const matchCustomer = r.booking.customerName.toLowerCase().includes(q);
        const matchEmail = r.booking.customerEmail.toLowerCase().includes(q);
        if (!matchNumber && !matchCode && !matchRef && !matchCustomer && !matchEmail) {
          return false;
        }
      }

      // Month
      if (selectedMonth !== 'ALL') {
        const d = new Date(r.issuedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key !== selectedMonth) return false;
      }

      // Payment method
      if (selectedMethod !== 'ALL' && r.paymentMethod !== selectedMethod) {
        return false;
      }

      // Check-in status
      if (selectedStatus === 'CHECKED_IN' && !r.booking.checkedInAt) return false;
      if (selectedStatus === 'PENDING' && r.booking.checkedInAt) return false;

      return true;
    });
  }, [receipts, search, selectedMonth, selectedMethod, selectedStatus]);

  // Rollup Metrics
  const totalAmountCents = filteredReceipts.reduce((sum, r) => sum + r.amountCents, 0);
  const totalCheckedIn = filteredReceipts.filter((r) => r.booking.checkedInAt).length;
  const checkInRate = filteredReceipts.length > 0 ? Math.round((totalCheckedIn / filteredReceipts.length) * 100) : 0;

  const handleCopy = (code: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleOpenVerify = (code: string) => {
    setActiveVerifyCode(code);
    setUhakikiOpen(true);
  };

  const handleStartEditNote = (r: ReceiptItem) => {
    setEditingNoteId(r.id);
    setNoteText(r.notes || '');
  };

  const handleSaveNote = async (id: string) => {
    setSavingNote(true);
    try {
      const res = await fetch(`/api/platform/receipts/${id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteText }),
      });
      const data = await res.json();
      if (data.success && data.receipt) {
        setReceipts((prev) =>
          prev.map((item) => (item.id === id ? { ...item, notes: data.receipt.notes } : item))
        );
        setEditingNoteId(null);
      } else {
        alert(data.error || 'Failed to update note.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating note.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Receipt Number',
      'Verification Code',
      'Booking Ref',
      'Issue Date',
      'Tourist Name',
      'Tourist Email',
      'Tourist Phone',
      'Tourist Country',
      'Language',
      'Service',
      'Tour Date',
      'Adults',
      'Children',
      'Amount USD',
      'Payment Method',
      'Payment Reference',
      'Check In Status',
      'Checked In At',
      'Checked In By',
      'Assigned Guide',
      'Reconciliation Notes',
    ];

    const rows = filteredReceipts.map((r) => {
      const b = r.booking;
      const serviceTitle =
        b.serviceType === 'TOUR'
          ? b.tour?.title || 'Tour Excursion'
          : `${b.pickupLocation || 'Pickup'} → ${b.dropoffLocation || 'Drop-off'}`;

      return [
        `"${r.receiptNumber}"`,
        `"${r.verificationCode}"`,
        `"${b.referenceCode}"`,
        `"${new Date(r.issuedAt).toISOString()}"`,
        `"${b.customerName.replace(/"/g, '""')}"`,
        `"${b.customerEmail}"`,
        `"${b.customerPhone}"`,
        `"${b.customerCountry || ''}"`,
        `"${b.locale || 'en'}"`,
        `"${serviceTitle.replace(/"/g, '""')}"`,
        `"${new Date(b.bookingDate).toLocaleDateString('en-US')}"`,
        b.numAdults,
        b.numChildren,
        (r.amountCents / 100).toFixed(2),
        `"${r.paymentMethod}"`,
        `"${r.paymentReference || ''}"`,
        b.checkedInAt ? '"CHECKED_IN"' : '"PENDING"',
        b.checkedInAt ? `"${new Date(b.checkedInAt).toISOString()}"` : '""',
        `"${b.checkedInBy?.name || ''}"`,
        `"${b.guideName || ''}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `zansafari-receipts-reconciliation-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
              Tax & Tourism Verification
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Official Receipts & Tour Uhakiki
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential TRA-compliant receipts (ZSH-2026-XXXXXX) and 6-letter verification check-in control
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleOpenVerify('')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Code (Uhakiki)</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={filteredReceipts.length === 0}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4-Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Receipts Issued</span>
          <div className="text-2xl font-black text-white">{filteredReceipts.length}</div>
          <span className="text-[11px] text-emerald-400">100% Paid in Full</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Revenue Recorded</span>
          <div className="text-2xl font-black text-emerald-400">{formatPrice(Math.round(totalAmountCents / 100))}</div>
          <span className="text-[11px] text-slate-500">Gross receipt value</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Checked-In Guests</span>
          <div className="text-2xl font-black text-sky-400">{totalCheckedIn}</div>
          <span className="text-[11px] text-sky-400">{checkInRate}% check-in completion rate</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Tour Check-In</span>
          <div className="text-2xl font-black text-amber-400">{filteredReceipts.length - totalCheckedIn}</div>
          <span className="text-[11px] text-amber-400/80">Awaiting tour day verification</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by receipt #, 6-char code, booking ref, or tourist name..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Month filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Service Months</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Payment Method filter */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="MPESA">M-Pesa</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="CASH">Cash</option>
          </select>

          {/* Check-In Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Check-In Statuses</option>
            <option value="CHECKED_IN">Checked-In Only</option>
            <option value="PENDING">Pending Check-In Only</option>
          </select>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="p-4">Receipt # / Issued</th>
                <th className="p-4">Uhakiki Code</th>
                <th className="p-4">Booking & Language</th>
                <th className="p-4">Tourist</th>
                <th className="p-4">Service & Date</th>
                <th className="p-4">Amount / Method</th>
                <th className="p-4">Check-In Status</th>
                <th className="p-4">Reconciliation Notes</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500">
                    No matching official receipts found.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => {
                  const b = r.booking;
                  const lang = getLanguageBadge(b.locale);
                  const isCheckedIn = !!b.checkedInAt;
                  const serviceTitle =
                    b.serviceType === 'TOUR'
                      ? b.tour?.title || 'Tour Excursion'
                      : `${b.pickupLocation || 'Pickup'} → ${b.dropoffLocation || 'Drop-off'}`;

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Receipt # */}
                      <td className="p-4 font-mono font-bold text-white">
                        <div>{r.receiptNumber}</div>
                        <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                          {new Date(r.issuedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Uhakiki Code */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenVerify(r.verificationCode)}
                            className="font-mono font-black text-sm tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 hover:border-emerald-400 transition-colors cursor-pointer"
                            title="Click to open Uhakiki verification"
                          >
                            {r.verificationCode}
                          </button>
                          <button
                            onClick={() => handleCopy(r.verificationCode)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === r.verificationCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Booking & Language */}
                      <td className="p-4">
                        <div className="font-mono text-slate-300 font-bold">{b.referenceCode}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${lang.color}`}>
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </span>
                        </div>
                      </td>

                      {/* Tourist */}
                      <td className="p-4">
                        <div className="font-bold text-white">{b.customerName}</div>
                        <div className="text-[11px] text-slate-400">{b.customerCountry || 'International'}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{b.customerPhone}</div>
                      </td>

                      {/* Service & Date */}
                      <td className="p-4 max-w-[200px]">
                        <div className="font-medium text-slate-200 truncate" title={serviceTitle}>
                          {serviceTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(b.bookingDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {b.numAdults} Ad{b.numChildren > 0 ? `, ${b.numChildren} Ch` : ''}
                        </div>
                      </td>

                      {/* Amount / Method */}
                      <td className="p-4">
                        <div className="font-bold text-emerald-400">
                          {formatPrice(Math.round(r.amountCents / 100))}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase mt-0.5">
                          {r.paymentMethod.replace(/_/g, ' ')}
                        </div>
                        {r.paymentReference && (
                          <div className="text-[10px] font-mono text-slate-500 truncate max-w-[100px]" title={r.paymentReference}>
                            {r.paymentReference}
                          </div>
                        )}
                      </td>

                      {/* Check-In Status */}
                      <td className="p-4">
                        {isCheckedIn ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Checked In</span>
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {new Date(b.checkedInAt!).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenVerify(r.verificationCode)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors cursor-pointer"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </button>
                        )}
                      </td>

                      {/* Notes (Offline refund/reconciliation) */}
                      <td className="p-4 max-w-[180px]">
                        {editingNoteId === r.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Offline notes / refund info..."
                              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-white w-full focus:outline-none focus:border-emerald-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveNote(r.id)}
                              disabled={savingNote}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                              title="Save Note"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group">
                            <span className="text-[11px] text-slate-400 truncate" title={r.notes || 'No notes'}>
                              {r.notes || <span className="text-slate-600 italic">No notes</span>}
                            </span>
                            <button
                              onClick={() => handleStartEditNote(r)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-all ml-1"
                              title="Edit Note"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/receipt/${r.receiptNumber}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition-colors"
                            title="View & Print Official Receipt"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Uhakiki Modal */}
      <UhakikiModal
        isOpen={uhakikiOpen}
        onClose={() => setUhakikiOpen(false)}
        initialCode={activeVerifyCode}
      />
    </div>
  );
}
