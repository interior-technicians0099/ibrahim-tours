'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Phone,
  MessageCircle,
  CreditCard,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  Lock,
  ChevronDown,
  X,
  Loader2,
  DollarSign,
  TrendingUp,
  Compass,
  Car,
  Star,
  User,
  LogOut,
  RefreshCw,
  ExternalLink,
  Layers,
  HelpCircle,
  Eye,
  Info,
  ShieldCheck,
  Receipt,
  FileText,
  AlertCircle,
  Check,
  Sparkles,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { BookingStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import LogoutButton from '@/components/auth/LogoutButton';

export interface OperatorPaymentItem {
  id: string;
  amountPaidCents: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  paymentReference: string | null;
  notes: string | null;
  recordedByName: string | null;
  createdAt: string;
}

export interface OperatorBookingItem {
  id: string;
  referenceCode: string;
  serviceType: 'TOUR' | 'TRANSPORT';
  tier: string | null;
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
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  amountPaidCents: number | null;
  totalPriceCents: number | null;
  quotedPriceCents: number | null;
  costCents: number | null;
  profitCents: number | null;
  commissionRate?: number | null;
  commissionAmountCents?: number | null;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  operatorNotes: string | null;
  cancellationReason: string | null;
  createdAt: string;
  payments?: OperatorPaymentItem[];
}

interface Props {
  initialBookings: OperatorBookingItem[];
  operatorName: string;
  operatorId: string;
}

export default function OperatorDashboardClient({
  initialBookings,
  operatorName,
  operatorId,
}: Props) {
  const [bookings, setBookings] = useState<OperatorBookingItem[]>(initialBookings);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING_7' | 'PAST'>('ALL');
  
  // Modals & Drawers State
  const [detailBooking, setDetailBooking] = useState<OperatorBookingItem | null>(null);
  const [activePaymentBooking, setActivePaymentBooking] = useState<OperatorBookingItem | null>(null);
  const [activeStatusBooking, setActiveStatusBooking] = useState<OperatorBookingItem | null>(null);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.MPESA);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Status Change Modal State
  const [targetStatus, setTargetStatus] = useState<BookingStatus>(BookingStatus.UNDER_REVIEW);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusGateAlert, setStatusGateAlert] = useState<string | null>(null);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const sevenDaysLater = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    return bookings.filter((b) => {
      const matchesSearch =
        b.referenceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customerPhone.includes(searchQuery) ||
        b.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || b.status === statusFilter;

      const bookingDateObj = new Date(b.rawBookingDate);
      let matchesDate = true;
      if (dateFilter === 'TODAY') {
        matchesDate = bookingDateObj >= todayStart && bookingDateObj <= todayEnd;
      } else if (dateFilter === 'UPCOMING_7') {
        matchesDate = bookingDateObj >= todayStart && bookingDateObj <= sevenDaysLater;
      } else if (dateFilter === 'PAST') {
        matchesDate = bookingDateObj < todayStart;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, searchQuery, statusFilter, dateFilter]);

  // Key Header Metrics (Mobile-first)
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysLater = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. New requests today
    const newRequestsToday = bookings.filter((b) => {
      return b.status === BookingStatus.REQUESTED;
    }).length;

    // 2. Upcoming tours (next 7 days)
    const upcomingTours7Days = bookings.filter((b) => {
      const bDate = new Date(b.rawBookingDate);
      return (
        bDate >= todayStart &&
        bDate <= sevenDaysLater &&
        b.status !== BookingStatus.CANCELLED &&
        b.status !== BookingStatus.REJECTED
      );
    }).length;

    // 3. Awaiting payment count
    const awaitingPaymentCount = bookings.filter((b) => {
      return (
        b.paymentStatus !== PaymentStatus.PAID_IN_FULL &&
        b.status !== BookingStatus.CANCELLED &&
        b.status !== BookingStatus.REJECTED
      );
    }).length;

    // 4. Total revenue recorded
    const totalCollectedCents = bookings.reduce((sum, b) => sum + (b.amountPaidCents || 0), 0);

    return {
      newRequestsToday,
      upcomingTours7Days,
      awaitingPaymentCount,
      totalCollectedFormatted: formatPrice(Math.round(totalCollectedCents / 100)),
    };
  }, [bookings]);

  // Open Payment Modal
  const openPaymentModal = (booking: OperatorBookingItem) => {
    setActivePaymentBooking(booking);
    const targetPrice = booking.quotedPriceCents || booking.totalPriceCents || 0;
    const remainingCents = Math.max(0, targetPrice - (booking.amountPaidCents || 0));
    setPaymentAmount((remainingCents / 100).toString());
    setPaymentMethod(PaymentMethod.MPESA);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRef('');
    setPaymentNotes('');
    setPaymentError(null);
    setPaymentSuccessMsg(null);
  };

  // Open Status Change Modal
  const openStatusModal = (booking: OperatorBookingItem) => {
    setActiveStatusBooking(booking);
    // Pick reasonable default next status
    if (booking.status === BookingStatus.REQUESTED) {
      setTargetStatus(BookingStatus.UNDER_REVIEW);
    } else if (booking.status === BookingStatus.UNDER_REVIEW) {
      setTargetStatus(BookingStatus.AWAITING_PAYMENT);
    } else {
      setTargetStatus(BookingStatus.AWAITING_PAYMENT);
    }
    setCancellationReason('');
    setStatusNotes('');
    setStatusError(null);
  };

  // Submit Payment Recording
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentBooking) return;

    const amountInCents = Math.round(parseFloat(paymentAmount) * 100);
    if (isNaN(amountInCents) || amountInCents <= 0) {
      setPaymentError('Please enter a valid payment amount greater than $0.');
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError(null);

    try {
      const res = await fetch(`/api/operator/bookings/${activePaymentBooking.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaidCents: amountInCents,
          paymentMethod,
          paymentDate,
          paymentReference: paymentRef.trim() || undefined,
          notes: paymentNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPaymentError(data.error || 'Failed to record payment.');
        setIsSubmittingPayment(false);
        return;
      }

      // Update local state with returned booking
      const updatedItem = data.booking;
      setBookings((prev) =>
        prev.map((b) => (b.id === activePaymentBooking.id ? { ...b, ...updatedItem } : b))
      );

      // If detail drawer is open for this booking, update it as well
      if (detailBooking && detailBooking.id === activePaymentBooking.id) {
        setDetailBooking((prev) => (prev ? { ...prev, ...updatedItem } : null));
      }

      setPaymentSuccessMsg(data.message);
      setTimeout(() => {
        setActivePaymentBooking(null);
        setIsSubmittingPayment(false);
      }, 1400);
    } catch (err: any) {
      setPaymentError(err?.message || 'Network error while recording payment.');
      setIsSubmittingPayment(false);
    }
  };

  // Submit Status Change
  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStatusBooking) return;

    // Frontend validation: Reason required for cancellation / rejection
    if (
      (targetStatus === BookingStatus.CANCELLED || targetStatus === BookingStatus.REJECTED) &&
      (!cancellationReason.trim() || cancellationReason.trim().length < 5)
    ) {
      setStatusError('A mandatory reason (at least 5 characters) is required when declining or cancelling a booking.');
      return;
    }

    setIsSubmittingStatus(true);
    setStatusError(null);

    try {
      const res = await fetch(`/api/operator/bookings/${activeStatusBooking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          reason: cancellationReason.trim() || undefined,
          operatorNotes: statusNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatusError(data.error || 'Failed to update status.');
        setIsSubmittingStatus(false);
        return;
      }

      const updated = data.booking;
      setBookings((prev) =>
        prev.map((b) => (b.id === activeStatusBooking.id ? { ...b, ...updated } : b))
      );

      if (detailBooking && detailBooking.id === activeStatusBooking.id) {
        setDetailBooking((prev) => (prev ? { ...prev, ...updated } : null));
      }

      setIsSubmittingStatus(false);
      setActiveStatusBooking(null);
    } catch (err: any) {
      setStatusError(err?.message || 'Network error updating booking status.');
      setIsSubmittingStatus(false);
    }
  };

  // One-Tap Complete Tour (only for CONFIRMED bookings)
  const handleOneTapComplete = async (booking: OperatorBookingItem) => {
    if (booking.status !== BookingStatus.CONFIRMED) {
      setStatusGateAlert('Cannot complete tour: Booking must be in CONFIRMED status with full payment recorded.');
      return;
    }

    try {
      const res = await fetch(`/api/operator/bookings/${booking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: BookingStatus.COMPLETED }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusGateAlert(data.error || 'Failed to complete booking.');
        return;
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, ...data.booking } : b))
      );
      if (detailBooking && detailBooking.id === booking.id) {
        setDetailBooking((prev) => (prev ? { ...prev, ...data.booking } : null));
      }
    } catch (err: any) {
      setStatusGateAlert(err?.message || 'Network error marking tour complete.');
    }
  };

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
              Ibrahim Tours Zanzibar • Bookings, Cash/M-Pesa Ledger & Verification
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
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shrink-0"
          >
            <span>Bookings & Ledger</span>
            <span className="px-1.5 py-0.2 bg-emerald-400 text-slate-950 rounded-full text-[10px] font-bold">
              {bookings.length}
            </span>
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
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Settlements & Statements</span>
          </Link>
        </div>
      </div>

      {/* 3. Main Dashboard Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Gate Alert Banner */}
        {statusGateAlert && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold">Operation Alert</strong>
              <span>{statusGateAlert}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusGateAlert(null)}
              className="text-rose-400 hover:text-rose-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header Stats Cards (Required: New requests, Upcoming 7 days, Awaiting payment) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          {/* 1. New Requests Today */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-sky-500/20 bg-sky-500/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                New Requests
              </span>
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-300">
              {metrics.newRequestsToday}
            </div>
            <span className="text-[10px] text-sky-500/80 mt-0.5 block">Awaiting review</span>
          </div>

          {/* 2. Upcoming Tours (Next 7 Days) */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-indigo-500/20 bg-indigo-500/5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 block mb-1">
              Upcoming (7 Days)
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-300">
              {metrics.upcomingTours7Days}
            </div>
            <span className="text-[10px] text-indigo-500/80 mt-0.5 block">Departing soon</span>
          </div>

          {/* 3. Awaiting Payment Count */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-amber-500/20 bg-amber-500/5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 block mb-1">
              Awaiting Payment
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-300">
              {metrics.awaitingPaymentCount}
            </div>
            <span className="text-[10px] text-amber-500/80 mt-0.5 block">Unconfirmed / Partial</span>
          </div>

          {/* 4. Total Cash & M-Pesa Collected */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/20 bg-emerald-500/5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
              Recorded Payments
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {metrics.totalCollectedFormatted}
            </div>
            <span className="text-[10px] text-emerald-500/80 mt-0.5 block">Total ledger sum</span>
          </div>

        </div>

        {/* Filter & Search Controls */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference (ZNZ-...), guest name, phone, or tour..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="REQUESTED">● REQUESTED (New)</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="AWAITING_PAYMENT">AWAITING PAYMENT</option>
              <option value="CONFIRMED">CONFIRMED (Paid)</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today Only</option>
              <option value="UPCOMING_7">Next 7 Days</option>
              <option value="PAST">Past Dates</option>
            </select>
          </div>

        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center">
              <Compass className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No bookings match your criteria</h3>
              <p className="text-xs text-slate-400">
                Try adjusting your search query or selecting a different status/date filter.
              </p>
            </div>
          ) : (
            filteredBookings.map((b) => {
              const targetPrice = (b.quotedPriceCents || b.totalPriceCents || 0) / 100;
              const paidAmount = (b.amountPaidCents || 0) / 100;
              const remaining = Math.max(0, targetPrice - paidAmount);
              const isPaidInFull = b.paymentStatus === PaymentStatus.PAID_IN_FULL;
              const isRequested = b.status === BookingStatus.REQUESTED;

              const cleanPhone = b.customerPhone.replace(/[^0-9]/g, '');
              const whatsAppText = encodeURIComponent(
                `Jambo ${b.customerName}! This is Ibrahim from Ibrahim Tours Zanzibar regarding your booking request ${b.referenceCode} for ${b.serviceTitle} on ${b.bookingDate}.`
              );
              const whatsAppUrl = `https://wa.me/${cleanPhone}?text=${whatsAppText}`;

              return (
                <div
                  key={b.id}
                  className={`bg-slate-900/70 border rounded-3xl p-5 sm:p-6 transition-all space-y-4 shadow-md ${
                    isRequested
                      ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/5 via-slate-900 to-slate-900'
                      : 'border-slate-800 hover:border-slate-700/80'
                  }`}
                >
                  {/* Top Bar: Reference, Badges & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm sm:text-base font-black text-sky-400">
                        {b.referenceCode}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {b.serviceType}
                      </span>
                      {isRequested && (
                        <span className="animate-pulse inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black tracking-wide">
                          ● NEW REQUEST
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Payment Status Badge */}
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                          isPaidInFull
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : b.paymentStatus === PaymentStatus.PARTIALLY_PAID
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {b.paymentStatus.replace('_', ' ')}
                      </span>

                      {/* Booking Status Badge */}
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                          b.status === BookingStatus.CONFIRMED
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : b.status === BookingStatus.COMPLETED
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                            : b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {b.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Main Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    
                    {/* Excursion / Service Info */}
                    <div className="space-y-1.5">
                      <span className="font-extrabold text-sm text-white block">
                        {b.serviceTitle}
                      </span>
                      {b.tier && (
                        <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider block">
                          Tier: {b.tier}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{b.bookingDate}</span>
                        {b.bookingTime && <span className="text-slate-500">({b.bookingTime})</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>
                          {b.numAdults} Adult{b.numAdults > 1 ? 's' : ''}
                          {b.numChildren > 0 ? `, ${b.numChildren} Child` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Location */}
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-200">
                        {b.customerName}{' '}
                        {b.customerCountry && (
                          <span className="text-slate-400 font-normal">({b.customerCountry})</span>
                        )}
                      </div>
                      <div className="text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{b.customerPhone}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="truncate">{b.pickupLocation || 'Pickup location not specified'}</span>
                      </div>
                    </div>

                    {/* Financial Summary & Balance */}
                    <div className="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Quoted Rate:</span>
                        <span className="font-bold text-white">{formatPrice(targetPrice)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Paid So Far:</span>
                        <span className="font-bold text-emerald-400">{formatPrice(paidAmount)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-slate-700/50">
                        <span className="text-slate-300">Balance:</span>
                        <span className={remaining > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                          {formatPrice(remaining)}
                        </span>
                      </div>
                      {b.payments && b.payments.length > 0 && (
                        <span className="text-[10px] text-slate-500 block pt-0.5">
                          {b.payments.length} payment{b.payments.length > 1 ? 's' : ''} recorded
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Rejection / Cancellation Reason Note */}
                  {b.cancellationReason && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                      <strong className="text-rose-400 block text-[10px] uppercase font-bold">
                        Reason for Cancellation / Rejection:
                      </strong>
                      <p className="mt-0.5 italic">{b.cancellationReason}</p>
                    </div>
                  )}

                  {/* Bottom Action Row (Touch targets >= 44px) */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    
                    {/* Left: Quick Actions: Call, WhatsApp, Detail View */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${b.customerPhone}`}
                        className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-sky-400" />
                        <span>Call</span>
                      </a>

                      <a
                        href={whatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setDetailBooking(b)}
                        className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-slate-400" />
                        <span>Details</span>
                      </button>
                    </div>

                    {/* Right: Record Payment & Status Transitions */}
                    <div className="flex items-center gap-2">
                      
                      {/* Record Payment Button */}
                      {b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REJECTED && (
                        <button
                          type="button"
                          onClick={() => openPaymentModal(b)}
                          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/30 transition-all"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Record Payment</span>
                        </button>
                      )}

                      {/* One-Tap Complete Tour Button (Available only if CONFIRMED) */}
                      {b.status === BookingStatus.CONFIRMED && (
                        <button
                          type="button"
                          onClick={() => handleOneTapComplete(b)}
                          className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Complete Tour</span>
                        </button>
                      )}

                      {/* Change Status Action */}
                      <button
                        type="button"
                        onClick={() => openStatusModal(b)}
                        className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1 transition-colors"
                      >
                        <span>Change Status</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>

                </div>
              );
            })
          )}
        </div>

      </main>

      {/* 4. Booking Detail View Modal / Drawer */}
      {detailBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-white font-mono">
                    {detailBooking.referenceCode}
                  </span>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {detailBooking.serviceType}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Created on {new Date(detailBooking.createdAt).toLocaleDateString()}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setDetailBooking(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Status Progression Timeline */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Booking Status Timeline
              </span>
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-center">
                {['REQUESTED', 'UNDER_REVIEW', 'AWAITING_PAYMENT', 'CONFIRMED', 'COMPLETED'].map((step, idx) => {
                  const stepOrder = ['REQUESTED', 'UNDER_REVIEW', 'AWAITING_PAYMENT', 'CONFIRMED', 'COMPLETED'];
                  const currentIdx = stepOrder.indexOf(detailBooking.status);
                  const isCurrent = detailBooking.status === step;
                  const isPassed = currentIdx >= idx;

                  return (
                    <div key={step} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] mb-1 font-extrabold ${
                          isCurrent
                            ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20'
                            : isPassed
                            ? 'bg-emerald-800 text-emerald-200'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isPassed ? '✓' : idx + 1}
                      </div>
                      <span className={`truncate max-w-[65px] ${isCurrent ? 'text-emerald-300' : 'text-slate-500'}`}>
                        {step.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer & Booking Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer Information</span>
                <div className="font-bold text-white text-sm">{detailBooking.customerName}</div>
                <div className="text-slate-300">{detailBooking.customerEmail}</div>
                <div className="text-slate-300">{detailBooking.customerPhone}</div>
                <div className="text-slate-400">Country: {detailBooking.customerCountry || 'Not provided'}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Specifications</span>
                <div className="font-bold text-white text-sm">{detailBooking.serviceTitle}</div>
                <div className="text-slate-300">Date: {detailBooking.bookingDate} ({detailBooking.bookingTime || 'Morning'})</div>
                <div className="text-slate-300">Guests: {detailBooking.numAdults} Adults{detailBooking.numChildren > 0 ? `, ${detailBooking.numChildren} Children` : ''}</div>
                <div className="text-slate-400">Pickup: {detailBooking.pickupLocation || 'Not specified'}</div>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Payment History Ledger
                </span>
                <button
                  type="button"
                  onClick={() => {
                    openPaymentModal(detailBooking);
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                >
                  + Add Payment
                </button>
              </div>

              {detailBooking.payments && detailBooking.payments.length > 0 ? (
                <div className="space-y-2">
                  {detailBooking.payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-emerald-400">
                          {formatPrice(p.amountPaidCents / 100)} ({p.paymentMethod.replace('_', ' ')})
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.paymentDate} {p.paymentReference ? `• Ref: ${p.paymentReference}` : ''}
                        </div>
                        {p.notes && <div className="text-[11px] text-slate-300 italic">{p.notes}</div>}
                      </div>
                      {p.recordedByName && (
                        <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                          By: {p.recordedByName}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No payment records logged yet. Click "+ Add Payment" to record cash or M-Pesa receipt.
                </p>
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDetailBooking(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. Payment Recording Form Modal */}
      {activePaymentBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Record Customer Payment
                </span>
                <h3 className="text-lg font-bold text-white">
                  Ref: {activePaymentBooking.referenceCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePaymentBooking(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Success Alerts */}
            {paymentError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {paymentError}
              </div>
            )}
            {paymentSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{paymentSuccessMsg}</span>
              </div>
            )}

            {/* Remaining Price Overview */}
            {(() => {
              const target = (activePaymentBooking.quotedPriceCents || activePaymentBooking.totalPriceCents || 0) / 100;
              const paid = (activePaymentBooking.amountPaidCents || 0) / 100;
              const remaining = Math.max(0, target - paid);
              const inputAmount = parseFloat(paymentAmount) || 0;
              const willBePaidInFull = (paid + inputAmount) >= target;

              return (
                <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  willBePaidInFull
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}>
                  <div className="flex justify-between font-bold">
                    <span>Quoted Price: {formatPrice(target)}</span>
                    <span>Paid So Far: {formatPrice(paid)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm">
                    <span>Remaining Balance:</span>
                    <span>{formatPrice(remaining)}</span>
                  </div>
                  <div className="pt-1 text-[11px] leading-relaxed border-t border-slate-700/40">
                    {willBePaidInFull ? (
                      <span className="text-emerald-300 font-bold">
                        ✓ Full payment reached! Booking will automatically transition to CONFIRMED, and confirmation emails will be sent to the Tourist and Platform Admin.
                      </span>
                    ) : (
                      <span className="text-amber-300">
                        • Partial payment. Booking will remain unconfirmed until full balance ({formatPrice(Math.max(0, remaining - inputAmount))}) is received.
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Amount Received in USD ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value={PaymentMethod.MPESA}>Vodacom M-Pesa</option>
                  <option value={PaymentMethod.CASH}>Cash (USD / TZS / EUR)</option>
                  <option value={PaymentMethod.BANK}>Bank Transfer (CRDB Bank)</option>
                  <option value={PaymentMethod.CARD}>Card / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Reference Code / Receipt Number (Optional)
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. M-Pesa ID: QW892019, or bank wire ref"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Handed to Ibrahim in person at hotel lobby..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActivePaymentBooking(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSubmittingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Record Payment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Status Change Action Sheet Modal */}
      {activeStatusBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                  Update Booking Status
                </span>
                <h3 className="text-lg font-bold text-white">
                  Ref: {activeStatusBooking.referenceCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveStatusBooking(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {statusError}
              </div>
            )}

            <form onSubmit={handleStatusChangeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Select Next Status *
                </label>
                <div className="space-y-2">
                  {[
                    { val: BookingStatus.UNDER_REVIEW, label: 'UNDER REVIEW', desc: 'Checking availability and schedules' },
                    { val: BookingStatus.AWAITING_PAYMENT, label: 'AWAITING PAYMENT', desc: 'Available! Sent payment instructions to guest' },
                    { val: BookingStatus.REJECTED, label: 'REJECTED', desc: 'Decline request (mandatory reason emailed to guest)' },
                    { val: BookingStatus.CANCELLED, label: 'CANCELLED', desc: 'Cancel booking (mandatory reason emailed to guest)' },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        targetStatus === opt.val
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="targetStatus"
                        value={opt.val}
                        checked={targetStatus === opt.val}
                        onChange={() => setTargetStatus(opt.val)}
                        className="mt-1"
                      />
                      <div>
                        <strong className="block font-bold">{opt.label}</strong>
                        <span className="text-[11px] text-slate-400">{opt.desc}</span>
                      </div>
                    </label>
                  ))}

                  {/* Disabled CONFIRMED option notice */}
                  <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-[11px]">
                      <strong>CONFIRMED</strong> cannot be manually selected. It is triggered only upon recording full payment (PAID_IN_FULL).
                    </span>
                  </div>
                </div>
              </div>

              {/* Mandatory Reason for Rejection / Cancellation */}
              {(targetStatus === BookingStatus.CANCELLED || targetStatus === BookingStatus.REJECTED) && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="block text-rose-400 font-bold">
                    Reason for {targetStatus} (Emailed directly to tourist) *
                  </label>
                  <textarea
                    required
                    minLength={5}
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. Fully booked on this date due to high season; please contact us on WhatsApp to discuss the following morning..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-rose-500/50 text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Internal Operator Notes (Optional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={2}
                  placeholder="Private internal note..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStatusBooking(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingStatus}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSubmittingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Status</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
