import React from 'react';
import Link from 'next/link';
import {
  Star,
  Quote,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Globe2,
} from 'lucide-react';
import { REVIEWS } from '@/lib/constants';

export default function ReviewsPreview() {
  return (
    <section className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>5-Star Guest Experiences</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Loved by Travelers Worldwide
          </h2>

          {/* Rating Badge */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <span className="font-extrabold text-slate-900 text-base">5.0 / 5.0</span>
            <span className="text-xs text-slate-500 font-medium">
              (Over 250+ Verified Zanzibar Guests)
            </span>
          </div>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {REVIEWS.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Rating Stars & Quote Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex text-amber-400">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-sky-200" />
                </div>

                {/* Tour Taken Tag */}
                <span className="inline-block text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full mb-3">
                  {review.tourTitle}
                </span>

                {/* Review Text */}
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed italic">
                  "{review.content}"
                </p>
              </div>

              {/* Author & Country */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">
                    {review.author}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                    <Globe2 className="w-3 h-3 text-slate-400" />
                    {review.country}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {review.date}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Link */}
        <div className="text-center">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 text-slate-800 hover:text-sky-600 hover:border-sky-300 font-bold text-sm shadow-xs transition-all hover:scale-105"
          >
            <span>Read All Guest Stories & Reviews</span>
            <ArrowRight className="w-4 h-4 text-sky-600" />
          </Link>
        </div>
      </div>
    </section>
  );
}
