'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Compass, RotateCcw, Frown } from 'lucide-react';
import { ALL_TOURS, TOUR_CATEGORIES } from '@/lib/constants';
import TourCard from './TourCard';
import TourFilterBar from './TourFilterBar';

export default function TourCatalog() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDuration, setSelectedDuration] = useState<string>('All');

  // Sync category from URL parameter if present
  useEffect(() => {
    if (categoryParam && TOUR_CATEGORIES.includes(categoryParam as any)) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TOUR_CATEGORIES.forEach((cat) => {
      counts[cat] = ALL_TOURS.filter((t) => t.category === cat).length;
    });
    return counts;
  }, []);

  // Filtered tours
  const filteredTours = useMemo(() => {
    return ALL_TOURS.filter((tour) => {
      // Category filter
      if (selectedCategory !== 'All' && tour.category !== selectedCategory) {
        return false;
      }

      // Duration filter
      if (selectedDuration !== 'All' && tour.duration !== selectedDuration) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchTitle = tour.title.toLowerCase().includes(query);
        const matchTagline = tour.tagline.toLowerCase().includes(query);
        const matchDesc = tour.description.toLowerCase().includes(query);
        const matchHighlights = tour.highlights?.some((h) =>
          h.toLowerCase().includes(query)
        );
        const matchInclusions = tour.inclusions.some((inc) =>
          inc.toLowerCase().includes(query)
        );
        return (
          matchTitle ||
          matchTagline ||
          matchDesc ||
          matchHighlights ||
          matchInclusions
        );
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedDuration]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDuration('All');
  };

  return (
    <div className="space-y-8">
      {/* Interactive Filter Bar */}
      <TourFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedDuration={selectedDuration}
        onDurationChange={setSelectedDuration}
        onResetFilters={handleResetFilters}
        categoryCounts={categoryCounts}
        totalToursCount={ALL_TOURS.length}
      />

      {/* Results Header Counter */}
      <div className="flex items-center justify-between px-2 text-xs sm:text-sm text-slate-500 font-medium">
        <span>
          Showing <strong className="text-slate-900">{filteredTours.length}</strong> of{' '}
          <strong className="text-slate-900">{ALL_TOURS.length}</strong> Zanzibar Excursions
        </span>
        {selectedCategory !== 'All' && (
          <span className="text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
            Category: {selectedCategory}
          </span>
        )}
      </div>

      {/* Tours Grid */}
      {filteredTours.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
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
          <h3 className="text-xl font-bold text-slate-900">
            No matching tours found
          </h3>
          <p className="text-slate-500 text-sm">
            We couldn't find any excursions matching your current filters or search terms. Try clearing your search or exploring all categories.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-600 text-white font-bold text-xs shadow-md hover:bg-sky-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
