'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  CalendarCheck,
  MessageCircle,
  Clock,
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
import { Tour, FeaturedTour, TourCategory } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

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

function FeaturedCardMedia({
  tour,
  categoryIcon,
}: {
  tour: Tour | FeaturedTour;
  categoryIcon: React.ReactNode;
}) {
  const images = React.useMemo(() => {
    if ((tour as any).images && (tour as any).images.length > 0) {
      return (tour as any).images.map((img: any) => img.url).filter(Boolean);
    }
    return tour.image ? [tour.image] : [];
  }, [tour]);

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    if (images.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [images.length, isPaused]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative aspect-[16/10] bg-gradient-to-br from-sky-800 via-slate-800 to-slate-900 overflow-hidden flex items-center justify-center p-4 text-center select-none"
    >
      {images.length > 0 && !imgError ? (
        <>
          {images.map((url: string, idx: number) => (
            <img
              key={url}
              src={url}
              alt={`${tour.title} ${idx + 1}`}
              onError={() => setImgError(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                idx === currentIndex
                  ? 'opacity-100 z-10 group-hover:scale-105'
                  : 'opacity-0 z-0 pointer-events-none'
              } transition-transform duration-500`}
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
          ))}

          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/60 backdrop-blur-xs">
              {images.map((_: any, idx: number) => (
                <span
                  key={idx}
                  className={`rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-3 h-1 bg-sky-400'
                      : 'w-1 h-1 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px] opacity-20 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-md group-hover:scale-110 transition-transform">
              {categoryIcon}
            </div>
          </div>
        </>
      )}

      {/* Top Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10">
          {categoryIcon}
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
  );
}

interface FeaturedToursProps {
  tours?: Tour[];
}

export default function FeaturedTours({ tours }: FeaturedToursProps) {
  const { t, locale } = useLanguage();

  const displayTours = tours && tours.length > 0 ? tours : FEATURED_PACKAGES;

  return (
    <section id="featured-tours" className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold tracking-wider uppercase mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>{t('featuredTours.badge')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('featuredTours.title')}
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-xl">
              {t('featuredTours.subtitle')}
            </p>
          </div>

          <Link
            href="/tours"
            className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-800 font-bold text-sm group self-start md:self-auto"
          >
            <span>{t('featuredTours.viewAll')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-transform" />
          </Link>
        </div>

        {/* 8 Featured Tours Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayTours.map((tour) => {
            const tourAny = tour as any;
            const priceNum: number =
              tourAny.price ??
              tourAny.pricing?.single ??
              (tourAny.pricing
                ? Math.min(
                    tourAny.pricing.single ?? 100,
                    tourAny.pricing.couple ?? 100,
                    tourAny.pricing.group5to10 ?? 100
                  )
                : 100);

            return (
              <article
                key={tour.id}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-sky-200 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Visual Image / Hero Card Area with Rotating Carousel */}
                  <FeaturedCardMedia
                    tour={tour}
                    categoryIcon={getCategoryIcon(tour.category)}
                  />

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
                        {t('featuredTours.startingFrom')}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">
                          {formatPrice(priceNum)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          / group tier
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {t('featuredTours.securePayment')}
                    </span>
                  </div>

                  {/* TWO CTAs: [Book Now] + [WhatsApp] */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/book?type=tour&tour=${encodeURIComponent(tour.slug)}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-xs shadow-sm shadow-sky-600/20 transition-colors text-center"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>{t('featuredTours.bookNow')}</span>
                    </Link>

                    <a
                      href={getTourWhatsAppLink(tour.title, locale)}
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
