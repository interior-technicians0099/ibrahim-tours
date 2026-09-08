'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  Compass,
  MessageCircle,
  Waves,
  Landmark,
  Trees,
  UtensilsCrossed,
  Palmtree,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Tour, TourCategory } from '@/lib/types';
import { formatPrice, getTourWhatsAppLink } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface TourCardProps {
  tour: Tour;
}

function getCategoryIcon(category: TourCategory) {
  switch (category) {
    case 'Sea & Water':
      return <Waves className="w-3.5 h-3.5 text-cyan-400" />;
    case 'City & Cultural':
      return <Landmark className="w-3.5 h-3.5 text-amber-400" />;
    case 'Nature & Wildlife':
      return <Trees className="w-3.5 h-3.5 text-emerald-400" />;
    case 'Island Experiences':
      return <UtensilsCrossed className="w-3.5 h-3.5 text-rose-400" />;
    case 'Beach & Island':
      return <Palmtree className="w-3.5 h-3.5 text-teal-400" />;
    case 'Full Day Combos':
      return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
    default:
      return <Compass className="w-3.5 h-3.5 text-sky-400" />;
  }
}

export default function TourCard({ tour }: TourCardProps) {
  const { t, locale } = useLanguage();
  const [imgError, setImgError] = React.useState(false);

  // Extract all valid images for the rotating gallery
  const allImages = React.useMemo(() => {
    if (tour.images && tour.images.length > 0) {
      return tour.images.map((img) => img.url).filter(Boolean);
    }
    return tour.image ? [tour.image] : [];
  }, [tour.images, tour.image]);

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const touchStartX = React.useRef<number | null>(null);

  // Auto-advance photos every 3.5 seconds if multiple images exist
  React.useEffect(() => {
    if (allImages.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [allImages.length, isPaused]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  };

  const handleDotClick = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(idx);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 40) {
      setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    } else if (deltaX < -40) {
      setCurrentIndex((prev) => (prev + 1) % allImages.length);
    }
    touchStartX.current = null;
  };

  const priceValues = [
    tour.pricing.single,
    tour.pricing.couple,
    tour.pricing.group5to10,
  ];
  if (tour.pricing.group20) {
    priceValues.push(tour.pricing.group20);
  }
  const lowestPrice = Math.min(...priceValues);

  return (
    <article
      id={tour.slug}
      className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-sky-300 transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Visual Image / Header with Auto-Slideshow */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative aspect-[16/10] bg-gradient-to-br from-sky-950 via-slate-900 to-slate-950 overflow-hidden flex items-center justify-center p-4 text-center select-none"
        >
          {allImages.length > 0 && !imgError ? (
            <>
              {allImages.map((url, idx) => (
                <img
                  key={url}
                  src={url}
                  alt={`${tour.title} photo ${idx + 1}`}
                  onError={() => setImgError(true)}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                    idx === currentIndex
                      ? 'opacity-100 z-10 group-hover:scale-105'
                      : 'opacity-0 z-0 pointer-events-none'
                  } transition-transform duration-500`}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              ))}

              {/* Prev / Next arrows for manual control on card */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous photo"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center backdrop-blur-xs opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-md active:scale-90"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next photo"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center backdrop-blur-xs opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-md active:scale-90"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/60 backdrop-blur-xs shadow-md">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => handleDotClick(e, idx)}
                        aria-label={`Go to photo ${idx + 1}`}
                        className={`rounded-full transition-all duration-300 ${
                          idx === currentIndex
                            ? 'w-4 h-1.5 bg-sky-400'
                            : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/90'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* Ambient Background Pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:14px_14px] opacity-20 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />

              {/* Center Category Icon */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-md group-hover:scale-110 transition-transform">
                  {getCategoryIcon(tour.category)}
                </div>
              </div>
            </>
          )}

          {/* Top Badges */}
          <div className="absolute top-3 left-3 z-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-xs">
              {getCategoryIcon(tour.category)}
              <span>{tour.category}</span>
            </span>
          </div>

          <div className="absolute top-3 right-3 z-20">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-900 text-[11px] font-bold shadow-xs">
              <Clock className="w-3 h-3 text-sky-600" />
              <span>{tour.duration}</span>
            </span>
          </div>

          {/* Bottom Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
        </div>

        {/* Content Details */}
        <div className="p-5 sm:p-6 space-y-2.5">
          <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-sky-600 transition-colors">
            {tour.title}
          </h3>

          <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
            {tour.description || tour.tagline}
          </p>
        </div>
      </div>

      {/* Pricing & Dual Action CTAs */}
      <div className="p-5 sm:p-6 pt-0">
        <div className="pt-3 pb-4 border-t border-slate-100 flex items-baseline justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              {t('featuredTours.startingFrom')}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">
                {formatPrice(lowestPrice)}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                / person
              </span>
            </div>
          </div>

          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            {t('featuredTours.securePayment')}
          </span>
        </div>

        {/* TWO CTAs: [View Details] + [WhatsApp] */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/tours/${tour.slug}`}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs shadow-xs transition-colors text-center"
          >
            <span>{t('featuredTours.viewAll')}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>

          <a
            href={getTourWhatsAppLink(tour.title, locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-bold text-xs shadow-xs shadow-emerald-500/20 transition-colors text-center"
            aria-label={`Inquire about ${tour.title} on WhatsApp`}
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </article>
  );
}
