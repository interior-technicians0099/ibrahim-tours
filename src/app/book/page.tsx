import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import BookingForm from '@/components/booking/BookingForm';
import { getDictionary } from '@/lib/i18n';
import { Locale } from '@/lib/i18n/types';

export const metadata: Metadata = {
  title: 'Request a Booking | Ibrahim Tours Zanzibar (Secure Payment)',
  description:
    'Submit your booking request for private Zanzibar excursions, Safari Blue, Stone Town tours, and airport transfers. Verified direct confirmation with full payment via M-Pesa or Bank.',
};

export default async function BookPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value as Locale) || 'en';
  const dict = getDictionary(locale);

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
              {dict.nav.home}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 rtl:rotate-180" />
            <span className="text-sky-300 font-semibold">{dict.nav.bookRequest}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{dict.whyChoose.feature4Badge} • {dict.hero.badgeBookingSub}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {dict.booking.title}
            </h1>

            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              {dict.booking.subtitle}
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
