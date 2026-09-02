import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Star,
  Quote,
  Globe2,
  CalendarCheck,
  MessageCircle,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  Users,
} from 'lucide-react';
import { OPERATOR, REVIEWS } from '@/lib/constants';
import { getWhatsAppLink } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Guest Reviews & 5-Star Testimonials | Ibrahim Tours Zanzibar',
  description:
    'Read verified 5-star traveler reviews for Ibrahim Tours Zanzibar. International travelers from the UK, Italy, Sweden, and around the world share their authentic private tour experiences.',
};

export default function ReviewsPage() {
  const reviewInquiryMsg =
    'Hello Ibrahim! I read the reviews from your guests on the website and would love to book a tour with you.';

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. Header Banner */}
      <section className="relative bg-gradient-to-b from-sky-950 via-slate-900 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
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
            <span className="text-sky-300 font-semibold">Guest Reviews</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>100% 5-Star Traveler Satisfaction</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Real Experiences from Our Guests
            </h1>

            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Discover honest feedback from international couples, families, and solo adventurers who explored Zanzibar with private guide Ibrahim.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24 space-y-16">
        {/* 2. Rating Summary Overview Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-24 h-24 rounded-3xl bg-amber-50 border border-amber-200/60 flex flex-col items-center justify-center text-amber-600 shadow-sm shrink-0">
              <span className="text-4xl font-black leading-none">5.0</span>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mt-1">
                Out of 5.0
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex text-amber-400 justify-center sm:justify-start">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Over 250+ Verified Traveler Reviews
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                100% genuine feedback across Safari Blue, Stone Town, Mnemba Snorkeling, and Private Island Transfers.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/book"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 text-center"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Book Your Tour</span>
            </Link>

            <a
              href={getWhatsAppLink(reviewInquiryMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 text-center"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* 3. Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {REVIEWS.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-sky-200" />
                </div>

                <span className="inline-block text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full mb-3 border border-sky-100">
                  {rev.tourTitle}
                </span>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed italic">
                  "{rev.content}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-slate-900 block">
                    {rev.author}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                    <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                    {rev.country}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    {rev.date}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 justify-end mt-0.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Verified Guest
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Card */}
        <section className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Ready for your own 5-star experience?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Book your private Zanzibar adventure today
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              Enjoy private guiding, transparent rates, and pay after arrival on the island.
            </p>
          </div>

          <Link
            href="/book"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm shadow-xl transition-all shrink-0 hover:scale-105 active:scale-95"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Request Your Dates</span>
          </Link>
        </section>
      </main>
    </div>
  );
}
