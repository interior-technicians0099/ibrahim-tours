'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  X,
  ExternalLink,
  DollarSign,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShieldCheck,
  Receipt,
  Layers,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { BookingStatus, PaymentStatus, CommissionStatus } from '@prisma/client';
import PlatformNav from '@/components/platform/PlatformNav';
import { exportToCsv } from '@/lib/export-csv';

export interface BookingPaymentItem {
  id: string;
  amountPaidCents: number;
  paymentMethod: string;
  paymentDate: string;
  paymentReference: string | null;
  notes: string | null;
  recordedByName: string;
}

export interface BookingAuditItem {
  id: string;
  action: string;
  userName: string;
  userRole: string | null;
  details: any;
  createdAt: string;
}

export interface MasterBookingItem {
  id: string;
  referenceCode: string;
  serviceType: string;
  serviceTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCountry: string | null;
  bookingDate: string;
  rawBookingDate: string;
  bookingTime: string | null;
  numAdults: number;
  numChildren: number;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  specialRequests: string | null;
  operatorId: string | null;
  operatorName: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  amountPaidCents: number;
  totalPriceCents: number;
  quotedPriceCents: number;
  costCents: number | null;
  profitCents: number | null;
  commissionRate: number | null;
  commissionAmountCents: number | null;
  commissionStatus: CommissionStatus | null;
  cancellationReason: string | null;
  operatorNotes: string | null;
  createdAt: string;
  payments: BookingPaymentItem[];
  auditLogs: BookingAuditItem[];
}

interface Props {
  initialBookings: MasterBookingItem[];
  adminName: string;
  adminEmail: string;
  operators: { id: string; name: string }[];
}

export default function PlatformBookingsMasterClient({
  initialBookings,
  adminName,
  adminEmail,
  operators,
}: Props) {
  const [bookings, setBookings] = useState<MasterBookingItem[]>(initialBookings);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [operatorFilter, setOperatorFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<MasterBookingItem | null>(null);
  const [isAnonymizing, setIsAnonymizing] = useState(false);
  const [anonymizeConfirmOpen, setAnonymizeConfirmOpen] = useState(false);

  const handleAnonymize = async (bookingId: string) => {
    setIsAnonymizing(true);
    try {
      const res = await fetch(`/api/platform/bookings/${bookingId}/anonymize`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to anonymize customer.');
        setIsAnonymizing(false);
        return;
      }
      const scrubbedName = `DELETED-${bookingId}`;
      const scrubbedEmail = `deleted-${bookingId.slice(-6)}@anonymized.local`;
      const scrubbedPhone = `DELETED-${bookingId.slice(-6)}`;

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                customerName: scrubbedName,
                customerEmail: scrubbedEmail,
                customerPhone: scrubbedPhone,
                pickupLocation: 'DELETED',
                dropoffLocation: 'DELETED',
                specialRequests: 'DELETED',
              }
            : b
        )
      );
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking((prev) =>
          prev
            ? {
                ...prev,
                customerName: scrubbedName,
                customerEmail: scrubbedEmail,
                customerPhone: scrubbedPhone,
                pickupLocation: 'DELETED',
                dropoffLocation: 'DELETED',
                specialRequests: 'DELETED',
              }
            : null
        );
      }
      setAnonymizeConfirmOpen(false);
      alert('Customer PII successfully scrubbed and anonymized under GDPR Article 17.');
    } catch (err: any) {
      alert(err?.message || 'Network error executing anonymization.');
    } finally {
      setIsAnonymizing(false);
    }
  };

  // Available months from booking dates
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => {
      if (b.bookingDate) {
        set.add(b.bookingDate.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [bookings]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.referenceCode.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        b.customerPhone.toLowerCase().includes(q) ||
        b.serviceTitle.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      const matchesPayment = paymentFilter === 'ALL' || b.paymentStatus === paymentFilter;
      const matchesMonth =
        monthFilter === 'ALL' || b.bookingDate.startsWith(monthFilter);
      const matchesOperator =
        operatorFilter === 'ALL' || b.operatorId === operatorFilter;

      return matchesSearch && matchesStatus && matchesPayment && matchesMonth && matchesOperator;
    });
  }, [bookings, searchQuery, statusFilter, paymentFilter, monthFilter, operatorFilter]);

  // CSV Export handler
  const handleExportCsv = () => {
    exportToCsv(
      `bookings_master_${new Date().toISOString().slice(0, 10)}.csv`,
      filteredBookings,
      [
        { header: 'Reference', key: 'referenceCode' },
        { header: 'Customer Name', key: 'customerName' },
        { header: 'Email', key: 'customerEmail' },
        { header: 'Phone', key: 'customerPhone' },
        { header: 'Country', key: 'customerCountry' },
        { header: 'Service Title', key: 'serviceTitle' },
        { header: 'Service Date', key: 'bookingDate' },
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
        { header: 'Payment Status', key: 'paymentStatus' },
        { header: 'Booking Status', key: 'status' },
        {
          header: 'Operator Cost (USD)',
          key: 'costCents',
          formatter: (v) => (v !== null ? (v / 100).toFixed(2) : 'N/A'),
        },
        {
          header: 'Gross Profit (USD)',
          key: 'profitCents',
          formatter: (v) => (v !== null ? (v / 100).toFixed(2) : 'N/A'),
        },
        {
          header: 'Commission Rate (%)',
          key: 'commissionRate',
          formatter: (v) => (v !== null ? `${v}%` : 'TBD'),
        },
        {
          header: 'Commission Due (USD)',
          key: 'commissionAmountCents',
          formatter: (v) => (v !== null ? (v / 100).toFixed(2) : 'N/A'),
        },
        { header: 'Commission Status', key: 'commissionStatus' },
        { header: 'Created At', key: 'createdAt' },
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
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bookings Master Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Complete platform ledger across all tour excursions, airport transfers, and private bookings
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-md self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export Filtered CSV ({filteredBookings.length})</span>
          </button>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference, customer name, email, phone, service..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Booking Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Booking Statuses</option>
                <option value="REQUESTED">REQUESTED</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="AWAITING_PAYMENT">AWAITING_PAYMENT</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="NOT_PAID">NOT_PAID</option>
                <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                <option value="PAID_IN_FULL">PAID_IN_FULL</option>
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Service Months</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Master Table */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 pb-3">
                <tr>
                  <th className="pb-3 pr-4">Reference</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Service</th>
                  <th className="pb-3 pr-4">Service Date</th>
                  <th className="pb-3 pr-4 text-right">Quoted</th>
                  <th className="pb-3 pr-4 text-right">Paid</th>
                  <th className="pb-3 pr-4 text-center">Payment</th>
                  <th className="pb-3 pr-4 text-center">Status</th>
                  <th className="pb-3 pr-4 text-right">Profit</th>
                  <th className="pb-3 pr-4 text-right">Commission</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-medium">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500">
                      No bookings match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedBooking(b)}
                    >
                      <td className="py-3.5 pr-4 font-mono font-bold text-white">{b.referenceCode}</td>
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold text-slate-200">{b.customerName}</div>
                        <div className="text-[10px] text-slate-400">{b.customerCountry || b.customerPhone}</div>
                      </td>
                      <td className="py-3.5 pr-4 max-w-[180px] truncate text-slate-300">
                        {b.serviceTitle}
                      </td>
                      <td className="py-3.5 pr-4 text-slate-400">{b.bookingDate}</td>
                      <td className="py-3.5 pr-4 text-right font-mono text-slate-300">
                        ${(b.quotedPriceCents / 100).toFixed(2)}
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
                      <td className="py-3.5 pr-4 text-right font-mono font-bold text-amber-300">
                        {b.commissionAmountCents !== null
                          ? `$${(b.commissionAmountCents / 100).toFixed(2)}`
                          : b.commissionStatus === CommissionStatus.MISSING_COST
                          ? 'Missing Cost'
                          : b.commissionStatus === CommissionStatus.PENDING_RATE
                          ? 'Pending Rate'
                          : '—'}
                      </td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(b);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-semibold transition-colors"
                        >
                          Details
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

      {/* Drill-In Modal Drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-lg font-black text-white">
                    {selectedBooking.referenceCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedBooking.status === BookingStatus.CONFIRMED
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : selectedBooking.status === BookingStatus.COMPLETED
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {selectedBooking.status}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedBooking.paymentStatus === PaymentStatus.PAID_IN_FULL
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {selectedBooking.paymentStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedBooking.serviceTitle}</p>
              </div>

              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Itinerary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Guest Contact
                </span>
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-white">{selectedBooking.customerName}</div>
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedBooking.customerEmail}</span>
                  </div>
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedBooking.customerPhone}</span>
                  </div>
                  {selectedBooking.customerCountry && (
                    <div className="text-slate-400 text-[11px]">
                      Country: {selectedBooking.customerCountry}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Service Specifications
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Date: {selectedBooking.bookingDate}</span>
                  </div>
                  {selectedBooking.bookingTime && (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Time: {selectedBooking.bookingTime}</span>
                    </div>
                  )}
                  <div className="text-slate-300">
                    Guests: {selectedBooking.numAdults} Adult(s)
                    {selectedBooking.numChildren > 0 ? `, ${selectedBooking.numChildren} Child(ren)` : ''}
                  </div>
                  {selectedBooking.pickupLocation && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>Pickup: {selectedBooking.pickupLocation}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Breakdown (Platform Admin View) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Internal Financial Economics (Confidential)</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Quoted Price</span>
                  <div className="text-base font-bold text-white mt-1">
                    ${(selectedBooking.quotedPriceCents / 100).toFixed(2)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Operator Cost</span>
                  <div className="text-base font-bold text-slate-300 mt-1">
                    {selectedBooking.costCents !== null
                      ? `$${(selectedBooking.costCents / 100).toFixed(2)}`
                      : 'Missing Cost'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Gross Profit</span>
                  <div className="text-base font-bold text-emerald-400 mt-1">
                    {selectedBooking.profitCents !== null
                      ? `$${(selectedBooking.profitCents / 100).toFixed(2)}`
                      : '—'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Commission Due</span>
                  <div className="text-base font-bold text-amber-300 mt-1">
                    {selectedBooking.commissionAmountCents !== null
                      ? `$${(selectedBooking.commissionAmountCents / 100).toFixed(2)}`
                      : 'TBD'}
                  </div>
                </div>
              </div>
            </div>

            {/* Discrete Payment Ledger */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Recorded Payment History</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">
                  {selectedBooking.payments.length} Transaction(s)
                </span>
              </h3>

              {selectedBooking.payments.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500 text-center">
                  No payment transactions recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedBooking.payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">${(p.amountPaidCents / 100).toFixed(2)}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-indigo-300">
                            {p.paymentMethod}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(p.paymentDate).toLocaleString('en-US')} • Recorded by {p.recordedByName}
                        </div>
                        {p.notes && <div className="text-[11px] text-slate-300 italic mt-1">&quot;{p.notes}&quot;</div>}
                      </div>
                      {p.paymentReference && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 uppercase">Ref</span>
                          <div className="font-mono text-xs text-slate-300">{p.paymentReference}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Trail Timeline */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Audit Trail History</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">
                  {selectedBooking.auditLogs.length} Event(s)
                </span>
              </h3>

              {selectedBooking.auditLogs.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500 text-center">
                  No audit log events recorded for this booking.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedBooking.auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-300">{log.action}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.createdAt).toLocaleString('en-US')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">By {log.userName}</div>
                      {log.details && (
                        <pre className="text-[10px] text-slate-400 font-mono bg-slate-900/90 p-2 rounded-lg overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GDPR Customer Anonymization Section */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    GDPR Data Protection & Right to Erasure
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Permanent erasure of traveler personal identifying information while strictly retaining financial audit totals
                  </p>
                </div>

                {selectedBooking.customerName.startsWith('DELETED') ? (
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700">
                    Already Anonymized
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAnonymizeConfirmOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Anonymize Customer</span>
                  </button>
                )}
              </div>

              {/* Confirmation Dialog */}
              {anonymizeConfirmOpen && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900/60 space-y-3">
                  <div className="flex items-start gap-2.5 text-rose-300 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-white font-bold">Permanently Erase Customer PII?</strong>
                      This will irreversibly overwrite customer name, email, phone, and pickup locations with DELETED identifiers in compliance with GDPR Art. 17. Financial totals will be preserved for reconciliation.
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isAnonymizing}
                      onClick={() => setAnonymizeConfirmOpen(false)}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isAnonymizing}
                      onClick={() => handleAnonymize(selectedBooking.id)}
                      className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 flex items-center gap-1 disabled:opacity-50"
                    >
                      {isAnonymizing ? 'Erasing...' : 'Confirm Anonymize'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
