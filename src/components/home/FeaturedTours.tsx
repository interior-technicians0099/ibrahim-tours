import React from 'react';
import Link from 'next/link';
import {
  Compass,
  CalendarCheck,
  MessageCircle,
  Clock,
  Tag,
  ArrowRight,
  Waves,
  Landmark,
  Trees,
  UtensilsCrossed,
  Palmtree,
  Layers,
} from 'lucide-react';
import { FEATURED_PACKAGES } from '@/lib/constants';
import { formatPrice, getTourWhatsAppLink } from '@/lib/utils';
import { TourCategory } from '@/lib/types';

function getCategoryIcon(category: TourCategory) {
  switch (category) {
    case 'Sea & Water':
      return <Waves className="w-3.5 h-3.5" />;
    case 'City & Cultural':
      return <Landmark className="w-3.5 h-3.5" />;
    case 'Nature & Wildlife':
      return <Trees className="w-3.5 h-3.5" />;
    case 'Island Experiences':
      return <UtensilsCrossed className="w-3.5 h-3.5" />;
    case 'Beach & Island':
      return <Palmtree className="w-3.5 h-3.5" />;
    case 'Full Day Combos':
      return <Layers className="w-3.5 h-3.5" />;
    default:
      return <Compass className="w-3.5 h-3.5" />;
  }
}

export default function FeaturedTours() {
  return (
    <section id="featured-tours" className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold tracking-wider uppercase mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Curated Island Adventures</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Featured Zanzibar Packages
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-xl">
              Handcrafted private excursions with licensed guidance, private
              boats, and hassle-free hotel pickups.
            </p>
          </div>

          <Link
            href="/tours"
            className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-800 font-bold text-sm group self-start md:self-auto"
          >
            <span>View All 14 Detailed Tours</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 8 Featured Tours Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_PACKAGES.map((tour) => (
            <article
              key={tour.id}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-sky-200 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Visual Image / Hero Card Area */}
                <div className="relative aspect-[16/10] bg-gradient-to-br from-sky-800 via-slate-800 to-slate-900 overflow-hidden flex items-center justify-center p-4 text-center">
                  {/* Category Accent Pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px] opacity-20 group-hover:scale-110 transition-transform duration-500" />

                  {/* Visual Title Icon in Center */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-md group-hover:scale-110 transition-transform">
                      {getCategoryIcon(tour.category)}
                    </div>
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10">
                      {getCategoryIcon(tour.category)}
                      <span>{tour.category}</span>
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 z-20">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold shadow-xs">
                      <Clock className="w-3 h-3 text-sky-600" />
                      <span>{tour.duration}</span>
                    </span>
                  </div>

                  {/* Bottom Gradient overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-sky-600 transition-colors">
                    {tour.title}
                  </h3>
                  <p className="mt-2 text-slate-500 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                    {tour.tagline}
                  </p>
                </div>
              </div>

              {/* Pricing & TWO CTAs */}
              <div className="p-5 pt-0">
                <div className="pt-3 pb-4 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                      Starting Price
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900">
                        {formatPrice(tour.price)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        / group tier
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Pay on Arrival
                  </span>
                </div>

                {/* TWO CTAs: [Book Now] + [WhatsApp] */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/book?type=tour&tour=${encodeURIComponent(tour.slug)}`}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-xs shadow-sm shadow-sky-600/20 transition-colors text-center"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Book Now</span>
                  </Link>

                  <a
                    href={getTourWhatsAppLink(tour.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-semibold text-xs shadow-sm shadow-emerald-500/20 transition-colors text-center"
                    aria-label={`Inquire about ${tour.title} on WhatsApp`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
