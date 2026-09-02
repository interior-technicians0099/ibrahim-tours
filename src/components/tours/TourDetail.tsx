import React from 'react';
import Link from 'next/link';
import {
  Clock,
  Compass,
  CheckCircle2,
  CalendarCheck,
  MessageCircle,
  ShieldCheck,
  MapPin,
  Sparkles,
  ChevronRight,
  Info,
  Car,
  HeartHandshake,
  Waves,
  Landmark,
  Trees,
  UtensilsCrossed,
  Palmtree,
  Layers,
} from 'lucide-react';
import { Tour, TourCategory } from '@/lib/types';
import { ALL_TOURS, OPERATOR } from '@/lib/constants';
import { formatPrice, getTourWhatsAppLink } from '@/lib/utils';
import PricingTable from '@/components/ui/PricingTable';
import TourCard from '@/components/tours/TourCard';

interface TourDetailProps {
  tour: Tour;
}

function getCategoryIcon(category: TourCategory) {
  switch (category) {
    case 'Sea & Water':
      return <Waves className="w-4 h-4 text-cyan-400" />;
    case 'City & Cultural':
      return <Landmark className="w-4 h-4 text-amber-400" />;
    case 'Nature & Wildlife':
      return <Trees className="w-4 h-4 text-emerald-400" />;
    case 'Island Experiences':
      return <UtensilsCrossed className="w-4 h-4 text-rose-400" />;
    case 'Beach & Island':
      return <Palmtree className="w-4 h-4 text-teal-400" />;
    case 'Full Day Combos':
      return <Layers className="w-4 h-4 text-indigo-400" />;
    default:
      return <Compass className="w-4 h-4 text-sky-400" />;
  }
}

export default function TourDetail({ tour }: TourDetailProps) {
  // Find up to 3 related tours from the same category (or other tours if not enough)
  const relatedTours = ALL_TOURS.filter((t) => t.id !== tour.id)
    .sort((a, b) => {
      if (a.category === tour.category && b.category !== tour.category) return -1;
      if (a.category !== tour.category && b.category === tour.category) return 1;
      return 0;
    })
    .slice(0, 3);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. Hero Header Banner */}
      <section className="relative bg-gradient-to-b from-sky-950 via-slate-900 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Breadcrumbs */}
          <nav
            className="flex items-center gap-2 text-xs text-slate-400 mb-6 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <Link href="/tours" className="hover:text-white transition-colors">
              Tours & Experiences
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-sky-300 font-semibold">{tour.title}</span>
          </nav>

          <div className="max-w-4xl space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-bold uppercase tracking-wider">
                {getCategoryIcon(tour.category)}
                <span>{tour.category}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>{tour.duration}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Private Tour</span>
              </span>
            </div>

            {/* Main Tour Title */}
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {tour.title}
            </h1>

            {/* Subtitle / Tagline */}
            <p className="text-lg sm:text-xl text-amber-300 font-medium leading-relaxed">
              {tour.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Main Column (8 cols) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Hero Visual Image Placeholder */}
            <div className="relative aspect-[16/9] rounded-3xl bg-gradient-to-br from-sky-950 via-slate-900 to-slate-950 overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center p-6 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
              <div className="relative z-10 flex flex-col items-center space-y-3">
                <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-xl">
                  {getCategoryIcon(tour.category)}
                </div>
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Zanzibar Private Experience • Guided by Ibrahim
                </span>
              </div>
            </div>

            {/* 2. Tour Description & Overview */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block mb-1">
                  Excursion Overview
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  About this Tour
                </h2>
              </div>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {tour.description}
              </p>

              {/* Highlights */}
              {tour.highlights && tour.highlights.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Key Highlights</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tour.highlights.map((highlight, index) => (
                      <div
                        key={index}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs sm:text-sm text-slate-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 3. Inclusions Section */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                  All-Inclusive Amenities
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  What's Included
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {tour.inclusions.map((inc, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Pricing Table Component */}
            <PricingTable pricing={tour.pricing} tourTitle={tour.title} />

            {/* 6. Good to Know Section */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-600" />
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Good to Know Before You Go
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Car className="w-4 h-4 text-sky-600" />
                    <span>Roundtrip Hotel Pickup</span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Pickup and drop-off are arranged directly at your resort or hotel lobby in a clean AC vehicle.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Flexible Departure Times</span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Since this is a private tour, we can adjust pickup time to match your schedule and tides.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Pay After Confirmation</span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    No online credit card payment. Pay in person on the day of the tour in USD, EUR, GBP, or M-Pesa.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <HeartHandshake className="w-4 h-4 text-rose-600" />
                    <span>Multilingual Guide</span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Ibrahim speaks fluent English, Swahili, and Italian for clear guidance and storytelling.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* 5. Sticky / Prominent Sidebar CTA Block (4 cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <span>Starting From</span>
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Pay on Arrival
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-slate-900">
                    {formatPrice(tour.pricing.couple)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    (Couple / 2 Pax)
                  </span>
                </div>
              </div>

              {/* Trust bullets */}
              <div className="space-y-2.5 py-4 border-y border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Private vehicle & boat charter</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Licensed local Zanzibar guide</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Free cancellation up to 24h before</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No credit card needed to request</span>
                </div>
              </div>

              {/* TWO Prominent CTAs */}
              <div className="space-y-3">
                <Link
                  href={`/book?type=tour&tour=${encodeURIComponent(tour.slug)}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-sm shadow-lg shadow-sky-600/25 active:scale-95 transition-all text-center"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Request Booking</span>
                </Link>

                <a
                  href={getTourWhatsAppLink(tour.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all text-center"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>

              {/* Guide Quick Support */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                <span>Questions? Call Ibrahim: </span>
                <a
                  href={`tel:${OPERATOR.phone}`}
                  className="font-bold text-slate-900 hover:text-sky-600"
                >
                  {OPERATOR.phone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 7. Related Tours Section */}
        {relatedTours.length > 0 && (
          <section className="pt-8 border-t border-slate-200/80 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                  You Might Also Like
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Similar Zanzibar Experiences
                </h2>
              </div>

              <Link
                href="/tours"
                className="inline-flex items-center gap-1 text-sm font-bold text-sky-600 hover:text-sky-800"
              >
                <span>View All Tours</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedTours.map((relTour) => (
                <TourCard key={relTour.id} tour={relTour} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
