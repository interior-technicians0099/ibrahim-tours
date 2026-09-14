'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  X,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Receipt,
  Layers,
  Trash2,
  AlertTriangle,
  Send,
  UserCheck,
  CheckCircle2,
  MessageSquare,
  Globe,
  PlusCircle,
  ExternalLink,
  FileText,
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
  locale: string;
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
  guideName: string | null;
  guidePhone: string | null;
  guideNotes: string | null;
  leadForwardedAt: string | null;
  workOrderSentAt: string | null;
  checkedInAt?: string | null;
  checkedInByName?: string | null;
  receiptNumber?: string | null;
  verificationCode?: string | null;
  payments: BookingPaymentItem[];
  auditLogs: BookingAuditItem[];
}

interface Props {
  initialBookings: MasterBookingItem[];
  adminName: string;
  adminEmail: string;
  operators: { id: string; name: string }[];
  leadGuide?: {
    leadGuideName: string;
    leadGuidePhone: string;
    leadGuideWhatsApp: string;
    leadGuideEmail: string;
  };
}

export function getLanguageBadge(locale: string) {
  const map: Record<string, { label: string; flag: string; bg: string; text: string }> = {
    en: { label: 'EN', flag: '🇬🇧', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-300' },
    it: { label: 'IT', flag: '🇮🇹', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-300' },
    fr: { label: 'FR', flag: '🇫🇷', bg: 'bg-indigo-500/10 border-indigo-500/30', text: 'text-indigo-300' },
    de: { label: 'DE', flag: '🇩🇪', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-300' },
    es: { label: 'ES', flag: '🇪🇸', bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-300' },
    sw: { label: 'SW', flag: '🇹🇿', bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-300' },
    ar: { label: 'AR', flag: '🇦🇪', bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-300' },
  };

  const key = (locale || 'en').toLowerCase();
  return map[key] || { label: key.toUpperCase(), flag: '🌐', bg: 'bg-slate-800 border-slate-700', text: 'text-slate-300' };
}

export default function PlatformBookingsMasterClient({
  initialBookings,
  adminName,
  adminEmail,
  operators,
  leadGuide,
}: Props) {
  const [bookings, setBookings] = useState<MasterBookingItem[]>(initialBookings);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<MasterBookingItem | null>(null);

  // Guide assignment form state
  const [guideNameInput, setGuideNameInput] = useState('');
  const [guidePhoneInput, setGuidePhoneInput] = useState('');
  const [guideNotesInput, setGuideNotesInput] = useState('');
  const [isSavingGuide, setIsSavingGuide] = useState(false);
  const [guideActionMsg, setGuideActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Payment form state
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState('CASH_USD');
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [paymentDateInput, setPaymentDateInput] = useState('');
  const [paymentNotesInput, setPaymentNotesInput] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Forward Lead & Work Order states
  const [isForwardingLead, setIsForwardingLead] = useState(false);
  const [isSendingIntro, setIsSendingIntro] = useState(false);
  const [isCompletingBooking, setIsCompletingBooking] = useState(false);

  // Anonymization state
  const [anonymizeConfirmOpen, setAnonymizeConfirmOpen] = useState(false);
  const [isAnonymizing, setIsAnonymizing] = useState(false);

  // Synchronize guide form when selecting booking
  const handleSelectBooking = (b: MasterBookingItem) => {
    setSelectedBooking(b);
    setGuideNameInput(b.guideName || '');
    setGuidePhoneInput(b.guidePhone || '');
    setGuideNotesInput(b.guideNotes || '');
    setGuideActionMsg(null);
    setPaymentError(null);
    setPaymentAmountInput('');
    setPaymentRefInput('');
    setPaymentNotesInput('');
  };

  // Distinct Months for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    bookings.forEach((b) => {
      if (b.rawBookingDate) {
        months.add(b.rawBookingDate.slice(0, 7)); // YYYY-MM
      }
    });
    return Array.from(months).sort().reverse();
  }, [bookings]);

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = b.referenceCode.toLowerCase().includes(q);
        const matchesCustomer = b.customerName.toLowerCase().includes(q);
        const matchesEmail = b.customerEmail.toLowerCase().includes(q);
        const matchesPhone = b.customerPhone.toLowerCase().includes(q);
        const matchesService = b.serviceTitle.toLowerCase().includes(q);
        const matchesCountry = (b.customerCountry || '').toLowerCase().includes(q);
        const matchesGuide = (b.guideName || '').toLowerCase().includes(q);
        if (!matchesRef && !matchesCustomer && !matchesEmail && !matchesPhone && !matchesService && !matchesCountry && !matchesGuide) {
          return false;
        }
      }

      // Booking status filter
      if (statusFilter !== 'ALL' && b.status !== statusFilter) {
        return false;
      }

      // Payment status filter
      if (paymentFilter !== 'ALL' && b.paymentStatus !== paymentFilter) {
        return false;
      }

      // Month filter
      if (monthFilter !== 'ALL' && !b.rawBookingDate.startsWith(monthFilter)) {
        return false;
      }

      return true;
    });
  }, [bookings, searchQuery, statusFilter, paymentFilter, monthFilter]);

  // CSV Export
  const handleExportCsv = () => {
    exportToCsv(
      `zansafari-bookings-${new Date().toISOString().slice(0, 10)}`,
      filteredBookings,
      [
        { header: 'Reference', key: 'referenceCode' },
        { header: 'Language', key: 'locale', formatter: (val) => String(val || 'en').toUpperCase() },
        { header: 'Customer', key: 'customerName' },
        { header: 'Country', key: 'customerCountry', formatter: (val) => val || 'International' },
        { header: 'Phone', key: 'customerPhone' },
        { header: 'Email', key: 'customerEmail' },
        { header: 'Service', key: 'serviceTitle' },
        { header: 'Date', key: 'bookingDate' },
        { header: 'Time', key: 'bookingTime', formatter: (val) => val || 'Morning' },
        { header: 'Adults', key: 'numAdults' },
        { header: 'Children', key: 'numChildren' },
        { header: 'Status', key: 'status' },
        { header: 'Payment Status', key: 'paymentStatus' },
        { header: 'Quoted Price ($)', key: 'quotedPriceCents', formatter: (val) => (val / 100).toFixed(2) },
        { header: 'Amount Paid ($)', key: 'amountPaidCents', formatter: (val) => (val / 100).toFixed(2) },
        { header: 'Assigned Guide', key: 'guideName', formatter: (val) => val || 'Unassigned' },
        { header: 'Guide Phone', key: 'guidePhone', formatter: (val) => val || '' },
        { header: 'Lead Forwarded At', key: 'leadForwardedAt', formatter: (val) => val || '' },
        { header: 'Work Order Sent At', key: 'workOrderSentAt', formatter: (val) => val || '' },
      ]
    );
  };

  // 1. One-tap Forward Lead to Ibrahim
  const handleForwardLead = async () => {
    if (!selectedBooking) return;
    setIsForwardingLead(true);
    try {
      const res = await fetch(`/api/platform/bookings/${selectedBooking.id}/forward-lead`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to forward lead.');

      // Update state
      const nowIso = new Date().toISOString();
      const updated = { ...selectedBooking, leadForwardedAt: nowIso };
      setSelectedBooking(updated);
      setBookings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));

      // Open WhatsApp prefilled message to Ibrahim
      if (data.whatsAppUrl) {
        window.open(data.whatsAppUrl, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'Error forwarding lead.');
    } finally {
      setIsForwardingLead(false);
    }
  };

  // 2. Save Offline Guide Details
  const handleSaveGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setIsSavingGuide(true);
    setGuideActionMsg(null);

    try {
      const res = await fetch(`/api/platform/bookings/${selectedBooking.id}/guide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideName: guideNameInput,
          guidePhone: guidePhoneInput,
          guideNotes: guideNotesInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save guide details.');

      const updated = {
        ...selectedBooking,
        guideName: data.booking.guideName,
        guidePhone: data.booking.guidePhone,
        guideNotes: data.booking.guideNotes,
      };

      setSelectedBooking(updated);
      setBookings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setGuideActionMsg({ type: 'success', text: data.message || 'Guide recorded successfully!' });
    } catch (err: any) {
      setGuideActionMsg({ type: 'error', text: err.message || 'Failed to save guide.' });
    } finally {
      setIsSavingGuide(false);
    }
  };

  // 3. Send Guide Intro to Tourist
  const handleSendGuideIntro = async () => {
    if (!selectedBooking) return;
    setIsSendingIntro(true);
    try {
      const res = await fetch(`/api/platform/bookings/${selectedBooking.id}/send-guide-intro`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch guide intro.');

      alert(data.message || 'Guide intro email dispatched to tourist!');
      if (data.whatsAppUrl) {
        window.open(data.whatsAppUrl, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send guide intro.');
    } finally {
      setIsSendingIntro(false);
    }
  };

  // 4. Record Payment (Relocated to Platform Admin)
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setPaymentError(null);

    const parsedAmount = parseFloat(paymentAmountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setPaymentError('Please enter a valid payment amount greater than $0.');
      return;
    }

    const amountPaidCents = Math.round(parsedAmount * 100);
    setIsRecordingPayment(true);

    try {
      const res = await fetch(`/api/platform/bookings/${selectedBooking.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaidCents,
          paymentMethod: paymentMethodInput,
          paymentReference: paymentRefInput.trim() || undefined,
          paymentDate: paymentDateInput ? new Date(paymentDateInput).toISOString() : new Date().toISOString(),
          notes: paymentNotesInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment.');

      const b = data.booking;
      const updated: MasterBookingItem = {
        ...selectedBooking,
        amountPaidCents: b.amountPaidCents || 0,
        paymentStatus: b.paymentStatus,
        status: b.status,
        profitCents: b.profitCents,
        workOrderSentAt: b.workOrderSentAt ? new Date(b.workOrderSentAt).toISOString() : selectedBooking.workOrderSentAt,
        payments: b.payments.map((p: any) => ({
          id: p.id,
          amountPaidCents: p.amountPaidCents,
          paymentMethod: p.paymentMethod,
          paymentDate: p.paymentDate,
          paymentReference: p.paymentReference,
          notes: p.notes,
          recordedByName: p.recordedBy?.name || 'Platform Admin',
        })),
      };

      setSelectedBooking(updated);
      setBookings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setPaymentAmountInput('');
      setPaymentRefInput('');
      setPaymentNotesInput('');

      // If work order was generated and returned, open WhatsApp link to Ibrahim
      if (data.workOrderWhatsAppUrl) {
        window.open(data.workOrderWhatsAppUrl, '_blank');
      }

      alert(data.message || 'Payment recorded successfully!');
    } catch (err: any) {
      setPaymentError(err.message || 'Error recording payment.');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // 5. Mark as Completed (Feeding B4 Commission Engine)
  const handleMarkCompleted = async () => {
    if (!selectedBooking) return;
    if (!confirm('Confirm that Ibrahim has completed this tour excursion and all services were delivered?')) return;

    setIsCompletingBooking(true);
    try {
      const res = await fetch(`/api/platform/bookings/${selectedBooking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete booking.');

      const b = data.booking;
      const updated: MasterBookingItem = {
        ...selectedBooking,
        status: b.status,
        profitCents: b.profitCents,
        commissionRate: b.commissionRate ? Number(b.commissionRate) * 100 : null,
        commissionAmountCents: b.commissionAmountCents,
        commissionStatus: b.commissionStatus,
      };

      setSelectedBooking(updated);
      setBookings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      alert(data.message || 'Booking marked as COMPLETED.');
    } catch (err: any) {
      alert(err.message || 'Error updating status.');
    } finally {
      setIsCompletingBooking(false);
    }
  };

  // 6. GDPR Anonymize Customer
  const handleAnonymize = async (bookingId: string) => {
    setIsAnonymizing(true);
    try {
      const res = await fetch(`/api/platform/bookings/${bookingId}/anonymize`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to anonymize customer.');

      const updated = {
        ...selectedBooking!,
        customerName: 'DELETED_CUSTOMER',
        customerEmail: 'deleted@zansafarihorizon.com',
        customerPhone: '0000000000',
        pickupLocation: 'DELETED_LOCATION',
        dropoffLocation: null,
        specialRequests: null,
      };

      setSelectedBooking(updated);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      setAnonymizeConfirmOpen(false);
      alert('Customer personal information erased according to GDPR Art. 17.');
    } catch (err: any) {
      alert(err.message || 'Error anonymizing customer.');
    } finally {
      setIsAnonymizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      <PlatformNav adminName={adminName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Header & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Bookings Master Control
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PLATFORM ADMIN
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Lead forwarding to Ibrahim, offline guide assignment, payment reconciliation, and work orders
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
                placeholder="Search reference, customer, country, guide, service..."
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
                  <th className="pb-3 pr-4">Language & Country</th>
                  <th className="pb-3 pr-4">Tourist</th>
                  <th className="pb-3 pr-4">Service</th>
                  <th className="pb-3 pr-4">Service Date</th>
                  <th className="pb-3 pr-4 text-right">Quoted</th>
                  <th className="pb-3 pr-4 text-right">Paid</th>
                  <th className="pb-3 pr-4 text-center">Payment</th>
                  <th className="pb-3 pr-4 text-center">Status</th>
                  <th className="pb-3 pr-4 text-center">Assigned Guide</th>
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
                  filteredBookings.map((b) => {
                    const lang = getLanguageBadge(b.locale);
                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                        onClick={() => handleSelectBooking(b)}
                      >
                        {/* Reference */}
                        <td className="py-3.5 pr-4 font-mono font-bold text-white whitespace-nowrap">
                          {b.referenceCode}
                        </td>

                        {/* Language & Country */}
                        <td className="py-3.5 pr-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${lang.bg} ${lang.text} flex items-center gap-1`}
                            >
                              <span>{lang.flag}</span>
                              <span>{lang.label}</span>
                            </span>
                            <span className="text-[11px] text-slate-300 font-medium">
                              {b.customerCountry || 'International'}
                            </span>
                          </div>
                        </td>

                        {/* Tourist */}
                        <td className="py-3.5 pr-4">
                          <div className="font-semibold text-slate-200">{b.customerName}</div>
                          <div className="text-[10px] text-slate-400">{b.customerPhone}</div>
                        </td>

                        {/* Service */}
                        <td className="py-3.5 pr-4 max-w-[160px] truncate text-slate-300">
                          {b.serviceTitle}
                        </td>

                        {/* Service Date */}
                        <td className="py-3.5 pr-4 text-slate-400 whitespace-nowrap">{b.bookingDate}</td>

                        {/* Quoted */}
                        <td className="py-3.5 pr-4 text-right font-mono text-slate-300 whitespace-nowrap">
                          ${(b.quotedPriceCents / 100).toFixed(2)}
                        </td>

                        {/* Paid */}
                        <td className="py-3.5 pr-4 text-right font-mono font-bold text-white whitespace-nowrap">
                          ${(b.amountPaidCents / 100).toFixed(2)}
                        </td>

                        {/* Payment Status */}
                        <td className="py-3.5 pr-4 text-center whitespace-nowrap">
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
                          {b.receiptNumber && (
                            <div className="mt-1">
                              <a
                                href={`/receipt/${b.receiptNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                                title={`Official Receipt: ${b.receiptNumber}`}
                              >
                                <Receipt className="w-3 h-3" />
                                <span>{b.receiptNumber}</span>
                              </a>
                            </div>
                          )}
                        </td>

                        {/* Booking Status */}
                        <td className="py-3.5 pr-4 text-center whitespace-nowrap">
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

                        {/* Guide Status */}
                        <td className="py-3.5 pr-4 text-center whitespace-nowrap">
                          {b.guideName ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              👤 {b.guideName}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              ⚠️ No guide yet
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 text-center whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectBooking(b);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-semibold transition-colors"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })
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
            {/* Drawer Header */}
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

            {/* Language Banner Requirement */}
            {(() => {
              const lang = getLanguageBadge(selectedBooking.locale);
              return (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-800/50 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-2xl shrink-0">
                    {lang.flag}
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-indigo-200 flex items-center gap-1.5">
                      <span>Tourist Language: {lang.label} ({selectedBooking.locale})</span>
                      <span className="text-slate-400 font-normal">• {selectedBooking.customerCountry || 'International'}</span>
                    </div>
                    <p className="text-slate-300 mt-1 leading-relaxed">
                      Ibrahim’s offline network must provide a guide fluent in <strong>{lang.label}</strong> (or handle directly).
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Official Receipt & Uhakiki Badge (if issued) */}
            {selectedBooking.receiptNumber && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
                      Official Tax Receipt
                    </span>
                    <span className="font-mono text-xs font-bold text-white">
                      {selectedBooking.receiptNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-2 pt-0.5">
                    <span>Uhakiki Code:</span>
                    <span className="font-mono font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      {selectedBooking.verificationCode}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {selectedBooking.checkedInAt
                        ? `• Checked in: ${new Date(selectedBooking.checkedInAt).toLocaleDateString()}`
                        : '• Ready for tour day check-in'}
                    </span>
                  </div>
                </div>

                <a
                  href={`/receipt/${selectedBooking.receiptNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Printable Receipt</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Quick Actions Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Forward Lead to Ibrahim */}
              <button
                type="button"
                disabled={isForwardingLead}
                onClick={handleForwardLead}
                className="p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/60 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Forward Lead to Ibrahim</span>
                  </div>
                  <div className="text-[10px] text-emerald-400/80 mt-0.5">
                    {selectedBooking.leadForwardedAt
                      ? `Forwarded: ${new Date(selectedBooking.leadForwardedAt).toLocaleDateString()}`
                      : 'Opens prefilled WhatsApp with language'}
                  </div>
                </div>
                <Send className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Mark as Completed */}
              {selectedBooking.status === BookingStatus.CONFIRMED &&
              selectedBooking.paymentStatus === PaymentStatus.PAID_IN_FULL ? (
                <button
                  type="button"
                  disabled={isCompletingBooking}
                  onClick={handleMarkCompleted}
                  className="p-3.5 rounded-2xl bg-sky-950/40 hover:bg-sky-900/50 border border-sky-700/60 text-left transition-all group flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Mark Tour Completed</span>
                    </div>
                    <div className="text-[10px] text-sky-400/80 mt-0.5">
                      {isCompletingBooking ? 'Calculating...' : 'Ibrahim completed tour • Feed B4 commission'}
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-500 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-400">Work Order Status</div>
                    <div className="text-[10px] mt-0.5">
                      {selectedBooking.workOrderSentAt
                        ? `Dispatched ${new Date(selectedBooking.workOrderSentAt).toLocaleDateString()}`
                        : 'Dispatches on PAID_IN_FULL'}
                    </div>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>

            {/* Offline Guide Assignment Card */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>Offline Guide Record (Ibrahim Network)</span>
                </span>
                {selectedBooking.guideName && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Assigned
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400">
                Guides are sourced offline by Ibrahim. Enter the guide&apos;s name and phone number once Ibrahim reports who is taking this tour.
              </p>

              <form onSubmit={handleSaveGuide} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Assigned Guide Name
                    </label>
                    <input
                      type="text"
                      value={guideNameInput}
                      onChange={(e) => setGuideNameInput(e.target.value)}
                      placeholder="e.g. Juma Hamisi"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Guide Phone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={guidePhoneInput}
                      onChange={(e) => setGuidePhoneInput(e.target.value)}
                      placeholder="e.g. +255 777 123 456"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Internal Guide Notes
                  </label>
                  <input
                    type="text"
                    value={guideNotesInput}
                    onChange={(e) => setGuideNotesInput(e.target.value)}
                    placeholder="e.g. Speaks Italian fluently; rendezvous at hotel lobby 08:30"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {guideActionMsg && (
                  <div
                    className={`text-xs p-2.5 rounded-xl border ${
                      guideActionMsg.type === 'success'
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-800 text-rose-300'
                    }`}
                  >
                    {guideActionMsg.text}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSavingGuide}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
                  >
                    {isSavingGuide ? 'Saving...' : 'Save Guide Details'}
                  </button>

                  {selectedBooking.guideName && selectedBooking.guidePhone && (
                    <button
                      type="button"
                      disabled={isSendingIntro}
                      onClick={handleSendGuideIntro}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Send className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isSendingIntro ? 'Sending...' : 'Send Guide Intro to Tourist'}</span>
                    </button>
                  )}
                </div>
              </form>
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

            {/* Financial Breakdown */}
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
                  <span className="text-slate-400 text-[11px]">Amount Paid</span>
                  <div className="text-base font-bold text-emerald-400 mt-1">
                    ${(selectedBooking.amountPaidCents / 100).toFixed(2)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Remaining Balance</span>
                  <div className="text-base font-bold text-amber-300 mt-1">
                    ${Math.max(0, (selectedBooking.quotedPriceCents - selectedBooking.amountPaidCents) / 100).toFixed(2)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Gross Profit</span>
                  <div className="text-base font-bold text-indigo-300 mt-1">
                    {selectedBooking.profitCents !== null
                      ? `$${(selectedBooking.profitCents / 100).toFixed(2)}`
                      : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Recording Form (Platform Admin Direct) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4" />
                  <span>Record Payment (Platform Admin)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Balance Due: ${Math.max(0, (selectedBooking.quotedPriceCents - selectedBooking.amountPaidCents) / 100).toFixed(2)}
                </span>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Payment Amount (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={paymentAmountInput}
                      onChange={(e) => setPaymentAmountInput(e.target.value)}
                      placeholder={`e.g. ${(selectedBooking.quotedPriceCents / 100).toFixed(2)}`}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethodInput}
                      onChange={(e) => setPaymentMethodInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="CASH_USD">Cash (USD)</option>
                      <option value="CASH_EUR">Cash (EUR)</option>
                      <option value="CASH_TZS">Cash (TZS)</option>
                      <option value="MPESA">M-Pesa</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CARD">Credit / Debit Card</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Reference / Receipt Number
                    </label>
                    <input
                      type="text"
                      value={paymentRefInput}
                      onChange={(e) => setPaymentRefInput(e.target.value)}
                      placeholder="e.g. MPESA-QW1289 / Bank Ref"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDateInput}
                      onChange={(e) => setPaymentDateInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Payment Notes
                  </label>
                  <input
                    type="text"
                    value={paymentNotesInput}
                    onChange={(e) => setPaymentNotesInput(e.target.value)}
                    placeholder="e.g. Received in cash at arrival; fully settled"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {paymentError && (
                  <div className="text-xs p-2.5 rounded-xl border bg-rose-950/60 border-rose-800 text-rose-300">
                    {paymentError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isRecordingPayment}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {isRecordingPayment ? 'Processing Payment...' : 'Record Payment & Auto-Confirm (if full)'}
                </button>
              </form>
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
