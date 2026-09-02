'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Compass,
  ChevronRight,
  ShieldCheck,
  Award,
  Users,
  RotateCcw,
  Frown,
  MessageCircle,
} from 'lucide-react';
import { ALL_TOURS, TOUR_CATEGORIES, OPERATOR } from '@/lib/constants';
import { getWhatsAppLink } from '@/lib/utils';
import TourCard from '@/components/tours/TourCard';

const FILTER_CATEGORIES = ['All', ...TOUR_CATEGORIES];

export default function ToursPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Filter tours based on active category chip
  const filteredTours = useMemo(() => {
    if (selectedCategory === 'All') {
      return ALL_TOURS;
    }
    return ALL_TOURS.filter((tour) => tour.category === selectedCategory);
  }, [selectedCategory]);

  // Compute count for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: ALL_TOURS.length,
    };
    TOUR_CATEGORIES.forEach((cat) => {
      counts[cat] = ALL_TOURS.filter((t) => t.category === cat).length;
    });
    return counts;
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header Banner Section */}
      <section className="relative bg-gradient-to-b from-sky-950 via-slate-900 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative Lighting */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Breadcrumb Navigation */}
          <nav
            className="flex items-center gap-2 text-xs text-slate-400 mb-6"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-sky-300 font-semibold">Tours & Experiences</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-bold uppercase tracking-wider mb-4">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>100% Private Guided Island Excursions</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Tours & Experiences
            </h1>

            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Explore Zanzibar with certified local guide Ibrahim. Browse our complete collection of private island excursions, dolphin swims, historic walks, and full-day combo packages with transparent USD pricing and zero upfront payment.
            </p>

            {/* Trust highlights banner */}
            <div className="mt-8 flex flex-wrap gap-4 text-xs font-semibold text-slate-200">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Upfront Prepayment</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <Users className="w-4 h-4 text-sky-400" />
                <span>Solo, Couple & Group Tiers</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <Award className="w-4 h-4 text-amber-400" />
                <span>10+ Years Licensed Guide</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-20 space-y-10">
        {/* Category Filter Chips Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {FILTER_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95'
                  }`}
                >
                  <span>{cat === 'All' ? 'All Tours' : cat}</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-sky-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between px-2 text-xs sm:text-sm text-slate-500 font-medium">
          <span>
            Showing <strong className="text-slate-900">{filteredTours.length}</strong> of{' '}
            <strong className="text-slate-900">{ALL_TOURS.length}</strong> Zanzibar Excursions
          </span>
          {selectedCategory !== 'All' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Show All</span>
            </button>
          )}
        </div>

        {/* Tours Grid */}
        {filteredTours.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Frown className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              No tours found in this category
            </h2>
            <p className="text-slate-500 text-sm">
              There are currently no excursions matching the selected category.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-600 text-white font-bold text-xs shadow-md hover:bg-sky-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>View All Tours</span>
            </button>
          </div>
        )}

        {/* Tailored Custom Combo Banner */}
        <section className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Need a Custom Tour or Multi-Day Package?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Design your personalized Zanzibar itinerary
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              Combine multiple sights into a single private day (e.g. Jozani Monkeys + Spice Farm + Sunset Dhow). Message Ibrahim directly on WhatsApp for custom pacing and pricing.
            </p>
          </div>

          <a
            href={getWhatsAppLink(
              'Hello Ibrahim! I would like to design a customized multi-tour package in Zanzibar.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all shrink-0 hover:scale-105 active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Customize on WhatsApp</span>
          </a>
        </section>
      </main>
    </div>
  );
}
