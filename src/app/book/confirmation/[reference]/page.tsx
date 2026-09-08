import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  AlertTriangle,
  MessageCircle,
  ArrowLeft,
  Banknote,
  Phone,
  Mail,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { getDictionary, isSupportedLocale, DEFAULT_LOCALE, Locale } from '@/lib/i18n';

interface PageProps {
  params: Promise<{ reference: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { reference } = await params;
  return {
    title: `Booking Request ${reference} | Ibrahim Tours Zanzibar`,
    description: `Booking request summary and payment instructions for reference ${reference}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function BookingConfirmationPage({ params }: PageProps) {
  const { reference } = await params;
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value;

  // Fetch booking with relations
  const booking = await prisma.booking.findUnique({
    where: { referenceCode: reference },
    include: {
      tour: true,
      transportService: true,
      route: true,
      operator: true,
    },
  });

  const resolvedLocale = (booking as any)?.locale || localeCookie || '';
  const locale: Locale = isSupportedLocale(resolvedLocale)
    ? (resolvedLocale as Locale)
    : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 p-8 rounded-2xl text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{dict.confirmation.notFoundTitle}</h1>
          <p className="text-slate-400 text-sm mb-6">
            {dict.confirmation.notFoundDesc}{' '}
            <code className="text-sky-400 font-mono font-bold">{reference}</code>.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{dict.confirmation.returnToBook}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch operator profile for payment instructions
  const rawOperator = booking.operator || (await prisma.operatorProfile.findFirst());
  const operator = rawOperator as {
    paymentInstructions?: string | null;
    paymentNotes?: string | null;
    mpesaNumber?: string | null;
    bankName?: string | null;
    bankAccount?: string | null;
    whatsapp?: string | null;
  } | null;

  const paymentInstructions =
    operator?.paymentInstructions ||
    'Your booking request has been reviewed and confirmed. To secure your reservation, please send the full payment to the M-Pesa number or Bank Account provided below. Your booking is confirmed only when full payment is received.';

  const serviceTitle =
    booking.serviceType === 'TOUR'
      ? booking.tour?.title || 'Zanzibar Island Tour'
      : `${booking.pickupLocation || 'Pickup'} → ${booking.dropoffLocation || 'Drop-off'}`;

  const formattedDate = new Date(booking.bookingDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const estimatedPriceFormatted = formatPrice(
    booking.totalPriceCents ? Math.round(booking.totalPriceCents / 100) : 0
  );

  const rawWhatsAppMsg = dict.whatsapp.bookingConfirmation
    .replace('{reference}', booking.referenceCode)
    .replace('{service}', serviceTitle)
    .replace('{date}', formattedDate);

  const rawPhone = operator?.whatsapp || '+255777123456';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '') || '255777123456';
  const whatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawWhatsAppMsg)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-400" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white transition-colors">
            {dict.confirmation.breadcrumbHome}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 rtl:rotate-180" />
          <Link href="/book" className="hover:text-white transition-colors">
            {dict.confirmation.breadcrumbBook}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 rtl:rotate-180" />
          <span className="text-sky-400 font-medium">{dict.confirmation.breadcrumbConfirmation}</span>
        </nav>

        {/* Hero Confirmation Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  {dict.confirmation.badgeLogged}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  {dict.confirmation.greeting.replace('{name}', booking.customerName)}
                </h1>
              </div>
            </div>

            <div className="text-left rtl:text-right sm:text-right rtl:sm:text-left bg-slate-800/60 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
                {dict.confirmation.refCode}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-sky-400 font-mono tracking-wide">
                {booking.referenceCode}
              </span>
            </div>
          </div>

          {/* Notice: Request Not Confirmed */}
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <strong className="block text-amber-300 font-bold mb-0.5">
                {dict.confirmation.alertTitle}
              </strong>
              <span>
                {dict.confirmation.alertDesc}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Summary */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <span>{dict.confirmation.summaryTitle}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-xs text-slate-400 block font-medium mb-1">{dict.confirmation.serviceRequested}</span>
                  <span className="font-bold text-white text-base">{serviceTitle}</span>
                  <span className="text-xs text-sky-400 block mt-0.5">
                    {booking.serviceType === 'TOUR' ? dict.confirmation.tourTypeLabel : dict.confirmation.transferTypeLabel}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-xs text-slate-400 block font-medium mb-1">{dict.confirmation.dateTimeLabel}</span>
                  <div className="font-bold text-white">{formattedDate}</div>
                  <div className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{booking.bookingTime || 'Morning'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-xs text-slate-400 block font-medium mb-1">{dict.confirmation.partySizeLabel}</span>
                  <div className="font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>
                      {dict.confirmation.adultsCount.replace('{count}', String(booking.numAdults))}
                      {booking.numChildren > 0 ? `, ${dict.confirmation.childrenCount.replace('{count}', String(booking.numChildren))}` : ''}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                  <span className="text-xs text-slate-400 block font-medium mb-1">{dict.confirmation.estimatedPriceLabel}</span>
                  <div className="text-xl font-extrabold text-emerald-400">
                    {estimatedPriceFormatted}
                  </div>
                  <span className="text-[11px] text-slate-400 block">{dict.confirmation.settleNote}</span>
                </div>
              </div>

              {/* Pickup / Route Details */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-1" />
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">{dict.confirmation.pickupLabel}</span>
                    <span className="text-slate-200 font-semibold">{booking.pickupLocation || dict.confirmation.pickupDefault}</span>
                  </div>
                </div>

                {booking.dropoffLocation && (
                  <div className="flex items-start gap-2 pt-2 border-t border-slate-700/50">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                    <div>
                      <span className="text-xs text-slate-400 font-medium block">{dict.confirmation.dropoffLabel}</span>
                      <span className="text-slate-200 font-semibold">{booking.dropoffLocation}</span>
                    </div>
                  </div>
                )}

                {booking.specialRequests && (
                  <div className="pt-2 border-t border-slate-700/50">
                    <span className="text-xs text-slate-400 font-medium block">{dict.confirmation.specialRequestsLabel}</span>
                    <p className="text-xs text-slate-300 italic mt-0.5">{booking.specialRequests}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Post-Booking Confidential Payment Instructions */}
            <div className="bg-slate-900/60 border border-amber-500/20 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2.5 text-amber-400">
                <Banknote className="w-5 h-5" />
                <h2 className="text-lg font-bold text-white">{dict.confirmation.paymentTitle}</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {dict.confirmation.paymentNoticeExcl}
              </p>
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                {paymentInstructions}
              </div>

              {operator?.paymentNotes ? (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200/90 leading-relaxed">
                  <strong className="text-amber-300 block mb-0.5">Transfer Note:</strong>
                  {operator.paymentNotes}
                </div>
              ) : null}

              {operator?.mpesaNumber ? (
                <div className="mt-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
                  <span className="text-xs text-emerald-400/80 font-bold uppercase tracking-wider block mb-1">{dict.confirmation.mpesaLabel}</span>
                  <span className="text-lg font-mono text-emerald-300">{operator.mpesaNumber}</span>
                </div>
              ) : null}

              {(operator?.bankName || operator?.bankAccount) ? (
                <div className="mt-4 p-4 rounded-xl bg-sky-950/30 border border-sky-900/50 space-y-2">
                  <span className="text-xs text-sky-400/80 font-bold uppercase tracking-wider block mb-1">{dict.confirmation.bankTransferTitle}</span>
                  {operator.bankName ? (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-sky-500/70 uppercase">{dict.confirmation.bankNameLabel}</span>
                      <span className="text-sm font-semibold text-sky-300">{operator.bankName}</span>
                    </div>
                  ) : null}
                  {operator.bankAccount ? (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-sky-500/70 uppercase">{dict.confirmation.accountNumberLabel}</span>
                      <span className="text-sm font-mono text-sky-300">{operator.bankAccount}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-1">
                <ShieldCheck className="w-4 h-4" />
                <span>{dict.confirmation.fullPaymentRequiredBadge}</span>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Contact & WhatsApp CTA */}
          <div className="space-y-6">
            
            {/* WhatsApp CTA Card */}
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">{dict.confirmation.whatsAppCardTitle}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {dict.confirmation.whatsAppCardDesc}
              </p>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{dict.confirmation.chatWithIbrahim}</span>
              </a>
              <span className="text-[11px] text-slate-400 block font-mono">
                {dict.confirmation.prefillRefNote.replace('{ref}', booking.referenceCode)}
              </span>
            </div>

            {/* Customer Details Snapshot */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {dict.confirmation.contactProvidedTitle}
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-medium">{booking.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-medium truncate">{booking.customerEmail}</span>
                </div>
              </div>
            </div>

            {/* Back to Home Link */}
            <div className="text-center pt-2">
              <Link
                href="/tours"
                className="text-xs text-slate-400 hover:text-sky-400 transition-colors inline-flex items-center gap-1.5"
              >
                <span>{dict.confirmation.browseMore}</span>
                <ChevronRight className="w-3 h-3 rtl:rotate-180" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
