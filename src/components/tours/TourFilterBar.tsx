'use client';

import React from 'react';
import { Search, X, Clock, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { TourCategory } from '@/lib/types';
import { TOUR_CATEGORIES } from '@/lib/constants';

interface TourFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDuration: string;
  onDurationChange: (duration: string) => void;
  onResetFilters: () => void;
  categoryCounts: Record<string, number>;
  totalToursCount: number;
}

export default function TourFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDuration,
  onDurationChange,
  onResetFilters,
  categoryCounts,
  totalToursCount,
}: TourFilterBarProps) {
  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedDuration !== 'All';

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6">
      {/* Search Input & Duration Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-grow max-w-lg">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by tour name, landmark (e.g., Mnemba, Tortoises, Spices)..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            aria-label="Search Zanzibar tours"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Duration Segmented Control + Reset */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
            {['All', 'Full Day', 'Half Day'].map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => onDurationChange(dur)}
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  selectedDuration === dur
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dur === 'All' ? 'All Durations' : dur}
              </button>
            ))}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {/* All Button */}
          <button
            type="button"
            onClick={() => onCategoryChange('All')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              selectedCategory === 'All'
                ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/25'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>All Experiences</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'All'
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {totalToursCount}
            </span>
          </button>

          {/* Categories */}
          {TOUR_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/25'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
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
    </div>
  );
}
