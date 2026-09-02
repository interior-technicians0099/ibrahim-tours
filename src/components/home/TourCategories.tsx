import React from 'react';
import Link from 'next/link';
import {
  Waves,
  Landmark,
  Trees,
  UtensilsCrossed,
  Palmtree,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { TourCategory } from '@/lib/types';

interface CategoryCardItem {
  title: TourCategory;
  description: string;
  count: string;
  icon: React.ReactNode;
  gradient: string;
}

const CATEGORIES_DATA: CategoryCardItem[] = [
  {
    title: 'Sea & Water',
    description: 'Mnemba coral reef snorkeling, wild dolphins & pristine Nakupenda sandbank.',
    count: '4 Tours',
    icon: <Waves className="w-6 h-6 text-cyan-400" />,
    gradient: 'from-cyan-900 to-sky-950',
  },
  {
    title: 'City & Cultural',
    description: 'UNESCO Stone Town alleys, historic Prison Island, organic spice farms & cooking.',
    count: '4 Tours',
    icon: <Landmark className="w-6 h-6 text-amber-400" />,
    gradient: 'from-amber-950 to-stone-900',
  },
  {
    title: 'Nature & Wildlife',
    description: 'Endemic Zanzibar Red Colobus monkeys & swimming in natural sea turtle lagoons.',
    count: '2 Tours',
    icon: <Trees className="w-6 h-6 text-emerald-400" />,
    gradient: 'from-emerald-950 to-slate-900',
  },
  {
    title: 'Island Experiences',
    description: 'Iconic ocean dining at The Rock Restaurant & secluded Michamvi sunsets.',
    count: '2 Tours',
    icon: <UtensilsCrossed className="w-6 h-6 text-rose-400" />,
    gradient: 'from-rose-950 to-slate-900',
  },
  {
    title: 'Beach & Island',
    description: 'World-famous Nungwi & Kendwa crystal beaches, tide-free swimming & dhow sails.',
    count: '2 Tours',
    icon: <Palmtree className="w-6 h-6 text-teal-400" />,
    gradient: 'from-teal-950 to-slate-900',
  },
  {
    title: 'Full Day Combos',
    description: 'All-inclusive multi-destination packages saving you time and transportation costs.',
    count: '3 Combos',
    icon: <Layers className="w-6 h-6 text-indigo-400" />,
    gradient: 'from-indigo-950 to-slate-900',
  },
];

export default function TourCategories() {
  return (
    <section className="py-20 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
            Explore by Style
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
            Zanzibar Tour Categories
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Whether you crave ocean adventures, wildlife encounters, or cultural immersion, Ibrahim has the perfect itinerary.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES_DATA.map((cat) => (
            <Link
              key={cat.title}
              href={`/tours?category=${encodeURIComponent(cat.title)}`}
              className="group relative rounded-3xl p-7 bg-gradient-to-br transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden flex flex-col justify-between border border-slate-800 text-white"
              style={{
                backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`,
              }}
            >
              {/* Background gradient from config */}
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-95 group-hover:opacity-100 transition-opacity`} />
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    {cat.icon}
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/10 text-slate-200">
                    {cat.count}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  {cat.title}
                </h3>
                <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-sky-300 group-hover:text-white transition-colors">
                <span>Browse {cat.title}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
