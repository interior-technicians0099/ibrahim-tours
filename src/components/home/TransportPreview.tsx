import React from 'react';
import Link from 'next/link';
import {
  Car,
  Plane,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Users,
  CheckCircle2,
  CalendarCheck,
  MessageCircle,
} from 'lucide-react';
import { VEHICLES } from '@/lib/constants';
import { formatPrice, getTransferWhatsAppLink } from '@/lib/utils';

const POPULAR_ROUTES = [
  {
    id: 'route-1',
    origin: 'Zanzibar Airport (ZNZ)',
    destination: 'Stone Town',
    distance: '10 km',
    duration: '20–30 min',
    van1to3Price: 20,
    van4to6Price: 25,
    highlight: 'Quick City Transfer',
  },
  {
    id: 'route-2',
    origin: 'Stone Town',
    destination: 'Nungwi / Kendwa',
    distance: '55 km',
    duration: '1–1.5 h',
    van1to3Price: 40,
    van4to6Price: 45,
    highlight: 'North Coast Beaches',
  },
  {
    id: 'route-3',
    origin: 'Zanzibar Airport (ZNZ)',
    destination: 'Paje / Jambiani',
    distance: '50 km',
    duration: '1–1.5 h',
    van1to3Price: 50,
    van4to6Price: 60,
    highlight: 'East Coast Kitesurf & Beach',
  },
];

export default function TransportPreview() {
  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold tracking-wider uppercase mb-2">
              <Car className="w-3.5 h-3.5 text-sky-400" />
              <span>Island-Wide Private Transport</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Need a Reliable Zanzibar Transfer?
            </h2>
            <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-xl">
              Private air-conditioned airport meet & greet, hotel-to-hotel
              shuttles, and ferry terminal transfers with professional drivers.
            </p>
          </div>

          <Link
            href="/transportation"
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold text-sm group self-start md:self-auto"
          >
            <span>View All 12 Routes & Vehicle Tiers</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 3 Popular Routes Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {POPULAR_ROUTES.map((route) => (
            <div
              key={route.id}
              className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl hover:border-sky-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300">
                    {route.highlight}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{route.duration}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2.5 text-sm font-bold text-white">
                    <Plane className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>{route.origin}</span>
                  </div>
                  <div className="w-0.5 h-4 bg-slate-600 ml-2" />
                  <div className="flex items-center gap-2.5 text-sm font-bold text-white">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{route.destination}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-[11px] text-slate-400 block">
                      Private Van (1–3 Pax)
                    </span>
                    <span className="text-2xl font-black text-white">
                      {formatPrice(route.van1to3Price)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">
                      4–6 Pax Van
                    </span>
                    <span className="text-lg font-bold text-slate-300">
                      {formatPrice(route.van4to6Price)}
                    </span>
                  </div>
                </div>

                {/* Direct Action */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/book?transfer=${encodeURIComponent(
                      `${route.origin} to ${route.destination}`
                    )}`}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md transition-colors text-center"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Book Route</span>
                  </Link>

                  <a
                    href={getTransferWhatsAppLink(
                      route.origin,
                      route.destination
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs shadow-md transition-colors text-center"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vehicle Fleet Strip */}
        <div className="bg-slate-800/50 rounded-3xl p-6 sm:p-8 border border-slate-700/60">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <span>Modern Air-Conditioned Fleet Available</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VEHICLES.map((v) => (
              <div
                key={v.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{v.name}</span>
                  <span className="text-amber-400 font-semibold">{v.capacity}</span>
                </div>
                <ul className="space-y-1 text-slate-400 pt-1">
                  {v.features.slice(0, 3).map((feat, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
