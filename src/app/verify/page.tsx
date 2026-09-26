import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { verifyReceiptCode } from '@/lib/services/receipt-service';
import { getReceiptBaseUrl } from '@/lib/services/receipt-service';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  MapPin,
  Phone,
  Search,
  Receipt as ReceiptIcon,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verify Receipt (Uhakiki) | Zansafari Horizon',
  description:
    'Self-service receipt verification — scan the QR code or enter the 6-letter uhakiki code to confirm a booking is PAID and valid.',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ code?: string }>;
}

/**
 * P0 — Public self-service uhakiki page for guides.
 * Scan QR (encodes {APP_URL}/verify?code=XXXXXX) or type the code manually.
 * Shows: validity (PAID / NOT PAID), service, date, pax, guide name.
 */
export default async function VerifyPage({ searchParams }: PageProps) {
  const { code: rawCode } = await searchParams;
  const code = (rawCode || '').trim().toUpperCase();

  let result: Awaited<ReturnType<typeof verifyReceiptCode>> | null = null;
  let lookupError: string | null = null;

  if (code) {
    try {
      result = await verifyReceiptCode(code);
    } catch (err: any) {
      lookupError = err?.message || 'Verification service is temporarily unavailable.';
    }
  }

  const baseUrl = getReceiptBaseUrl();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zansafari Horizon • Uhakiki</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Verify Receipt</h1>
          <p className="text-xs text-slate-400">
            Scan the QR on the tourist receipt, or enter the 6-letter check-in code below.
          </p>
        </div>

        {/* Code entry form (plain GET — works without JS) */}
        <form
          action="/verify"
          method="get"
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="code"
              defaultValue={code}
              placeholder="e.g. K9X2P7 or ZSH-2026-000001"
              maxLength={32}
              autoComplete="off"
              autoCapitalize="characters"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono font-bold uppercase tracking-widest text-white placeholder:text-slate-600 placeholder:font-sans placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0"
          >
            Verify
          </button>
        </form>

        {/* Result */}
        {lookupError ? (
          <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-300 text-sm">Verification unavailable</p>
              <p className="text-xs text-red-300/80 mt-1">{lookupError}</p>
            </div>
          </div>
        ) : result && code ? (
          result.isValid && result.booking && result.receipt ? (
            <div className="rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-slate-900">
              <div className="bg-gradient-to-r from-emerald-700 to-teal-600 px-5 py-4 flex items-center gap-3">
                <CheckCircle2 className="w-7 h-7 text-white shrink-0" />
                <div>
                  <p className="font-black text-white text-lg leading-tight">VALID • PAID IN FULL</p>
                  <p className="text-emerald-100 text-xs font-mono">
                    {result.receipt.receiptNumber} • Code {result.receipt.verificationCode}
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-4 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Service</p>
                  <p className="font-bold text-white">{result.booking.serviceTitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</p>
                      <p className="font-semibold text-slate-200 text-xs">
                        {result.booking.tourDate} ({result.booking.bookingTime})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pax</p>
                      <p className="font-semibold text-slate-200 text-xs">
                        {result.booking.numAdults} Adults
                        {result.booking.numChildren > 0 ? `, ${result.booking.numChildren} Children` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pickup</p>
                    <p className="font-semibold text-slate-200 text-xs">{result.booking.pickupLocation}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tourist</span>
                    <span className="font-bold text-white">{result.booking.customerName}</span>
                  </div>
                  {result.booking.guideName ? (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned guide</span>
                      <span className="font-bold text-emerald-300">
                        {result.booking.guideName}
                        {result.booking.guidePhone ? ` • ${result.booking.guidePhone}` : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned guide</span>
                      <span className="text-slate-500 italic">Not yet assigned</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Check-in</span>
                    <span className={result.booking.checkedInAt ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                      {result.booking.checkedInAt
                        ? `CHECKED IN${result.booking.checkedInByName ? ` by ${result.booking.checkedInByName}` : ''}`
                        : 'PENDING — show this screen at the office'}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/receipt/${encodeURIComponent(result.receipt.receiptNumber)}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs transition-all"
                >
                  <ReceiptIcon className="w-4 h-4" />
                  <span>Open full official receipt</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-300 text-sm">NOT VALID — do not board</p>
                <p className="text-xs text-red-300/80 mt-1">{result.reason}</p>
                <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call the office to confirm payment before departing.</span>
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Enter a code above to check receipt validity. Guides: this page works on any phone —
              no login required.
            </p>
            <p className="text-[11px] text-slate-600 font-mono mt-2">{baseUrl}/verify?code=XXXXXX</p>
          </div>
        )}
      </div>
    </div>
  );
}
