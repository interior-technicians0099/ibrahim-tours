import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCompanyProfile } from '@/lib/company';
import { generateReceiptQrDataUrl } from '@/lib/services/receipt-service';
import { formatPrice } from '@/lib/utils';
import PrintReceiptButton from '@/components/receipt/PrintReceiptButton';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  ArrowLeft,
  QrCode,
  FileCheck2,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ receiptNumber: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { receiptNumber } = await params;
  return {
    title: `Official Receipt ${receiptNumber} | Zansafari Horizon`,
    description: `Official branded tax receipt and tour day check-in verification voucher for ${receiptNumber}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PublicReceiptPage({ params }: PageProps) {
  const { receiptNumber } = await params;

  const receipt = await prisma.receipt.findUnique({
    where: { receiptNumber },
    include: {
      booking: {
        include: {
          tour: true,
          transportService: true,
          route: true,
          operator: true,
          payments: {
            orderBy: { createdAt: 'desc' },
          },
          checkedInBy: {
            select: { name: true, email: true },
          },
        },
      },
      issuedBy: {
        select: { name: true, email: true },
      },
    },
  });

  if (!receipt || !receipt.booking) {
    notFound();
  }

  const booking = receipt.booking;
  const company = await getCompanyProfile();
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const qrDataUrl = await generateReceiptQrDataUrl(`${baseUrl}/receipt/${receipt.receiptNumber}`);

  const serviceTitle =
    booking.serviceType === 'TOUR'
      ? booking.tour?.title || 'Zanzibar Island Tour'
      : `${booking.pickupLocation || 'Pickup'} → ${booking.dropoffLocation || 'Drop-off'}`;

  const tourDateFormatted = new Date(booking.bookingDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const issuedDateFormatted = new Date(receipt.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const checkedInDateFormatted = booking.checkedInAt
    ? new Date(booking.checkedInAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const amountPaidFormatted = formatPrice(Math.round(receipt.amountCents / 100));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:text-black print:p-0">
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .receipt-container {
            box-shadow: none !important;
            border: 1px solid #cccccc !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            padding: 24px !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top bar with back link & print button */}
        <div className="flex flex-wrap items-center justify-between gap-4 no-print">
          <Link
            href={`/book/confirmation/${booking.referenceCode}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Confirmation</span>
          </Link>

          <PrintReceiptButton receiptNumber={receipt.receiptNumber} />
        </div>

        {/* Main Printable Receipt Card */}
        <div className="receipt-container bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 print:border-black print:p-6 print:bg-white">
          
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-800 print:border-slate-300">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 print:border-black print:text-black">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>TRA Registered Tour Operator</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight print:text-black">
                {company.companyName}
              </h1>
              <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                Stone Town, Zanzibar, Tanzania • Phone / WhatsApp: {company.officialWhatsapp || '+255 618 769 150'}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono mt-2 print:text-slate-700">
                <span>TIN / TRA: TRA-ZNZ-2024-8841</span>
                <span>•</span>
                <span>REG: ZNZ-BR-2024-00892</span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1 print:text-slate-600">
                Official Tax Receipt
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400 print:text-black">
                {receipt.receiptNumber}
              </span>
              <span className="text-xs text-slate-400 block mt-1 font-mono print:text-slate-600">
                Issued: {issuedDateFormatted}
              </span>
            </div>
          </div>

          {/* Uhakiki & Check-In Verification Banner */}
          <div className="bg-gradient-to-br from-emerald-950/60 via-slate-800/80 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 print:border-black print:bg-slate-50">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block print:text-emerald-800">
                Tour Day Uhakiki / Check-In Code
              </span>
              <div className="text-4xl font-black font-mono tracking-widest text-white print:text-black">
                {receipt.verificationCode}
              </div>
              <p className="text-xs text-slate-300 max-w-md leading-relaxed print:text-slate-700">
                Present this 6-letter verification code to your guide on tour day. The office uses this code for rapid check-in validation.
              </p>
            </div>

            {/* Scannable QR Code */}
            {qrDataUrl && (
              <div className="shrink-0 flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl shadow-md">
                <img
                  src={qrDataUrl}
                  alt={`QR code for receipt ${receipt.receiptNumber}`}
                  className="w-28 h-28 object-contain"
                />
                <span className="text-[10px] font-mono font-bold text-slate-800 uppercase tracking-wider">
                  Scan to Verify
                </span>
              </div>
            )}
          </div>

          {/* Check-In Status Indicator */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs print:border-slate-300 print:bg-slate-50">
            <div className="flex items-center gap-2.5">
              <FileCheck2 className={`w-5 h-5 ${booking.checkedInAt ? 'text-emerald-400' : 'text-amber-400'}`} />
              <div>
                <span className="font-bold text-white print:text-black block">
                  Check-In Status: {booking.checkedInAt ? 'CHECKED IN (Uhakiki Umekamilika)' : 'VALID & PENDING CHECK-IN (Inasubiri Uhakiki)'}
                </span>
                {booking.checkedInAt && checkedInDateFormatted && (
                  <span className="text-slate-400 text-[11px] print:text-slate-600">
                    Verified on: {checkedInDateFormatted} {booking.checkedInBy?.name ? `by ${booking.checkedInBy.name}` : ''}
                  </span>
                )}
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full font-bold uppercase text-[10px] tracking-wider ${
                booking.checkedInAt
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:border-black print:text-black'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 print:border-black print:text-black'
              }`}
            >
              {booking.checkedInAt ? 'Verified' : 'Pending'}
            </span>
          </div>

          {/* 2-Column Details: Guest & Trip Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            {/* Guest Details */}
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3 print:border-slate-300 print:bg-slate-50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-700">
                Tourist Details
              </h3>
              <div className="space-y-1.5">
                <div className="font-bold text-white text-base print:text-black">
                  {booking.customerName}
                </div>
                <div className="text-xs text-slate-300 print:text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>{booking.customerEmail}</span>
                </div>
                <div className="text-xs text-slate-300 print:text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{booking.customerPhone}</span>
                </div>
                {booking.customerCountry && (
                  <div className="text-xs text-slate-400 print:text-slate-600">
                    Country: <span className="text-slate-200 font-medium print:text-black">{booking.customerCountry}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Booking & Service Details */}
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3 print:border-slate-300 print:bg-slate-50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-700">
                Service & Itinerary
              </h3>
              <div className="space-y-1.5">
                <div className="font-bold text-white text-base print:text-black">
                  {serviceTitle}
                </div>
                <div className="text-xs text-slate-300 print:text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>{tourDateFormatted} ({booking.bookingTime || 'Morning'})</span>
                </div>
                <div className="text-xs text-slate-300 print:text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{booking.numAdults} Adults{booking.numChildren > 0 ? `, ${booking.numChildren} Children` : ''}</span>
                </div>
                <div className="text-xs text-slate-300 print:text-slate-700 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{booking.pickupLocation || 'Stone Town / Hotel lobby'}</span>
                </div>
                {booking.dropoffLocation && (
                  <div className="text-xs text-slate-400 print:text-slate-600">
                    Drop-off: <span className="text-slate-200 font-medium print:text-black">{booking.dropoffLocation}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment & Settlement Summary Table (NEVER leaks cost, profit, or commission) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-700">
              Financial Breakdown
            </h3>
            <table className="w-full text-xs sm:text-sm border-collapse rounded-xl overflow-hidden border border-slate-800 print:border-slate-300">
              <thead>
                <tr className="bg-slate-800/80 text-slate-400 font-semibold text-left border-b border-slate-700 print:bg-slate-100 print:text-slate-700">
                  <th className="p-3">Description</th>
                  <th className="p-3">Method / Ref</th>
                  <th className="p-3 text-right">Amount (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                <tr>
                  <td className="p-3 font-medium text-white print:text-black">
                    {serviceTitle} — Full Payment
                  </td>
                  <td className="p-3 text-slate-300 font-mono print:text-slate-700">
                    {receipt.paymentMethod.replace(/_/g, ' ')}
                    {receipt.paymentReference ? ` (${receipt.paymentReference})` : ''}
                  </td>
                  <td className="p-3 text-right font-bold text-white print:text-black">
                    {amountPaidFormatted}
                  </td>
                </tr>
                <tr className="bg-emerald-950/20 text-emerald-300 font-bold print:bg-slate-100 print:text-black">
                  <td colSpan={2} className="p-3 text-right uppercase tracking-wider">
                    Total Amount Paid:
                  </td>
                  <td className="p-3 text-right text-base text-emerald-400 print:text-black font-black">
                    {amountPaidFormatted}
                  </td>
                </tr>
                <tr className="text-slate-400 text-xs print:text-slate-600">
                  <td colSpan={2} className="p-3 text-right uppercase">
                    Balance Due:
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400 print:text-black">
                    $0.00 (PAID IN FULL)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terms & Footer */}
          <div className="pt-6 border-t border-slate-800 text-center space-y-2 text-xs text-slate-500 print:border-slate-300 print:text-slate-600">
            <p>
              This is an official computer-generated receipt issued by <strong>{company.companyName}</strong> under Zanzibar Tourism Regulations.
            </p>
            <p>
              For inquiries or assistance, reach our 24/7 guest desk: <span className="text-slate-300 font-semibold print:text-black">{company.officialPhone || '+255 618 769 150'}</span> or email <span className="text-slate-300 font-semibold print:text-black">{company.officialEmail || 'info@zansafarihorizon.com'}</span>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
