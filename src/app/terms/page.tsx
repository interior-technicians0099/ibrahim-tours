import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  Clock,
  Scale,
  ChevronRight,
  AlertTriangle,
  CreditCard,
  Compass,
  CheckCircle2,
  Calendar,
  HelpCircle,
} from 'lucide-react';
import { OPERATOR } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms of Service & Booking Conditions | Ibrahim Tours Zanzibar',
  description:
    'Review the official terms of service for Ibrahim Tours Zanzibar. Clear policies on private excursion booking requests, full payment upon confirmation, weather guarantees, and cancellation rules.',
};

export default function TermsOfServicePage() {
  const lastUpdated = 'September 8, 2026';

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. Header Banner */}
      <section className="relative bg-gradient-to-b from-sky-950 via-slate-900 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <nav
            className="flex items-center gap-2 text-xs text-slate-400 mb-6"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-sky-300 font-semibold">Terms of Service</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-bold uppercase tracking-wider mb-4">
            <Scale className="w-4 h-4 text-sky-400" />
            <span>Official Booking Terms & Guest Agreement</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Terms of Service & Tour Conditions
          </h1>

          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            Welcome to Ibrahim Tours Zanzibar. These terms explain how booking requests work, our payment-in-full confirmation policy, safe weather guarantees, and cancellation rights.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Effective Date: {lastUpdated}
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Licensed Under Zanzibar Commission for Tourism (ZCT)
            </span>
          </div>
        </div>
      </section>

      {/* 2. Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24 space-y-8">
        
        {/* Core Guarantee Summary Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
          <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-sky-600" />
            Key Booking Highlights
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-600">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Request-First Model</span>
              Submitting online is 100% free with zero upfront credit card charge.
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Direct Verification</span>
              Ibrahim confirms your date and details directly via email & WhatsApp.
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Weather Guarantee</span>
              If ocean conditions are unsafe, reschedule freely or receive a 100% refund.
            </div>
          </div>
        </div>

        {/* Section 1: Agreement & Service Scope */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-4 text-slate-700 text-sm leading-relaxed">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            1. Scope of Services
          </h3>
          <p>
            Ibrahim Tours Zanzibar operates private personalized guided excursions, cultural tours, marine safaris, and island transfers across Unguja (Zanzibar) and Pemba. All tours are operated by certified, licensed local Zanzibari guides in compliance with Zanzibar Tourism Commission regulations.
          </p>
        </div>

        {/* Section 2: Booking Requests & Confirmation Gating */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-4 text-slate-700 text-sm leading-relaxed">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            2. Booking Request & Payment-in-Full Policy
          </h3>
          <p>
            When you complete the booking form at <Link href="/book" className="text-sky-600 font-semibold hover:underline">/book</Link>, your submission creates an official <strong>Booking Request</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li>
              <strong>No Online Charge:</strong> We do not ask for or charge your credit card on the website.
            </li>
            <li>
              <strong>Direct Review:</strong> Ibrahim reviews your party size, pickup hotel, and timing to guarantee vehicle availability.
            </li>
            <li>
              <strong>Payment in Full Required for Confirmation:</strong> In accordance with our operational business rules, an excursion is legally and operationally <strong>CONFIRMED</strong> only once full payment (<span className="font-mono font-bold text-emerald-700">PAID_IN_FULL</span>) has been recorded via cash, Vodacom M-Pesa, or direct bank transfer.
            </li>
            <li>
              <strong>Confidential Payment Instructions:</strong> Official M-Pesa account numbers and CRDB Bank details are communicated only on your verified booking confirmation page and via transactional confirmation email.
            </li>
          </ul>
        </div>

        {/* Section 3: Pricing & Currency */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-4 text-slate-700 text-sm leading-relaxed">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-600" />
            3. Pricing, Inclusions & Currency
          </h3>
          <p>
            All quoted prices include licensed guiding services, private air-conditioned vehicle transport, national park entry fees, and marine reserve permits as specified in your selected tier.
          </p>
          <p>
            Prices are quoted in <strong>US Dollars ($ USD)</strong>. We also accept equivalent payment in Euro (€ EUR), British Pounds (£ GBP), or Tanzanian Shillings (TZS) converted at current market exchange rates upon arrival.
          </p>
        </div>

        {/* Section 4: Cancellation & Weather Guarantees */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-4 text-slate-700 text-sm leading-relaxed">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            4. Cancellation, Rescheduling & Weather Guarantees
          </h3>
          <ul className="space-y-3">
            <li className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <strong className="text-slate-900 block mb-0.5">Flexible Cancellation:</strong>
              Cancel free of charge up to 24 hours before your excursion start time.
            </li>
            <li className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-950">
              <strong className="text-emerald-900 block mb-0.5">Ocean Safety & Weather Guarantee:</strong>
              Marine excursions (Safari Blue, Mnemba Snorkeling, Nakupenda Sandbank) are subject to sea conditions. If the Zanzibar Maritime Authority or our licensed captains advise against departure due to wind or rough seas, you may reschedule freely or receive a 100% refund.
            </li>
          </ul>
        </div>

        {/* Section 5: Cultural Respect & Environmental Stewardship */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-4 text-slate-700 text-sm leading-relaxed">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            5. Cultural Respect & Marine Conservation
          </h3>
          <p>
            Zanzibar is an island rich in Swahili heritage and marine biodiversity. We kindly ask our guests to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>Dress respectfully with covered shoulders and knees when walking through Stone Town and residential villages.</li>
            <li>Never touch, stand on, or break living coral reefs during snorkeling or scuba sessions.</li>
            <li>Avoid collecting seashells or single-use plastics in marine sanctuaries.</li>
          </ul>
        </div>

        {/* Section 6: Governing Law */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-4 text-slate-700 text-sm leading-relaxed">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-sky-600" />
            6. Governing Law & Dispute Resolution
          </h3>
          <p>
            These terms are governed by the laws of the Revolutionary Government of Zanzibar and the United Republic of Tanzania. In the event of any question or dispute, we encourage open, friendly communication directly with Ibrahim Mohamed to find an equitable solution.
          </p>
        </div>

        {/* CTAs */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">
              Questions About Our Booking Terms?
            </h3>
            <p className="text-xs text-slate-500">
              Reach out directly to Ibrahim for any personalized questions or custom itinerary arrangements.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Contact Ibrahim
            </Link>
            <Link
              href="/privacy"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
