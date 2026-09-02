import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarCheck,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { OPERATOR } from '@/lib/constants';
import BookingForm from '@/components/booking/BookingForm';

export const metadata: Metadata = {
  title: 'Request a Booking | Ibrahim Tours Zanzibar (No Advance Payment)',
  description:
    'Submit your booking request for private Zanzibar excursions, Safari Blue, Stone Town tours, and airport transfers. Zero upfront deposit required. Operator confirms manually via WhatsApp.',
};

export default function BookPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. Header Banner */}
      <section className="relative bg-gradient-to-b from-sky-950 via-slate-900 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <nav
            className="flex items-center gap-2 text-xs text-slate-400 mb-6"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-sky-300 font-semibold">Request Booking</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Fast 30-Second Request Form</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Request Your Zanzibar Booking
            </h1>

            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              No prepayment or credit card required. Choose your tour or transfer, submit your preferred date, and Ibrahim will personally confirm availability within 1 hour.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24">
        <Suspense
          fallback={
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 font-semibold shadow-md">
              Loading booking form...
            </div>
          }
        >
          <BookingForm />
        </Suspense>
      </main>
    </div>
  );
}
