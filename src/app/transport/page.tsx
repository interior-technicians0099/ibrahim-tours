import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Car,
  Plane,
  ChevronRight,
  ShieldCheck,
  Clock,
  MapPin,
  CalendarCheck,
  MessageCircle,
} from 'lucide-react';
import { OPERATOR } from '@/lib/constants';
import { getWhatsAppLink } from '@/lib/utils';
import TransferCalculator from '@/components/transport/TransferCalculator';
import RouteList from '@/components/transport/RouteList';
import VehicleFleet from '@/components/transport/VehicleFleet';
import AirportMeetGreet from '@/components/transport/AirportMeetGreet';

export const metadata: Metadata = {
  title: 'Zanzibar Private Airport Transfers & Taxi Fares | Complete Price Guide',
  description:
    'Book reliable private air-conditioned airport transfers in Zanzibar with Ibrahim. Fixed rates between Zanzibar Airport (ZNZ), Stone Town, Nungwi, Kendwa, Paje, and Jambiani. No advance online payment required.',
};

export default function TransportPage() {
  const customTransferMsg =
    'Hello Ibrahim! I need a private transfer in Zanzibar for my group. Can you share availability?';

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <section className="relative bg-gradient-to-b from-sky-950 via-slate-900 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Breadcrumbs */}
          <nav
            className="flex items-center gap-2 text-xs text-slate-400 mb-6"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-sky-300 font-semibold">Transportation & Transfers</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-bold uppercase tracking-wider mb-4">
              <Car className="w-4 h-4 text-sky-400" />
              <span>Island-Wide Private Transport</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Zanzibar Private Transfers & Airport Taxi
            </h1>

            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Transparent fixed fares for airport pickups, hotel-to-hotel shuttles, and ferry terminal transfers across Zanzibar. Professional licensed drivers and clean dual-AC vehicles.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 text-xs font-semibold text-slate-200">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <Plane className="w-4 h-4 text-sky-400" />
                <span>Free Airport Meet & Greet</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Advance Deposit</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>24/7 Available on WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-20 space-y-16">
        {/* 1. Interactive Fare Estimator */}
        <TransferCalculator />

        {/* 2. Airport VIP Meet & Greet Guarantee */}
        <AirportMeetGreet />

        {/* 3. All 12 Route Cards with Pricing */}
        <RouteList />

        {/* 4. Modern Vehicle Fleet Showcase */}
        <VehicleFleet />

        {/* 5. Custom Route Banner */}
        <section className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Need a Custom Route or Day Chauffeur?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Rent a private car & driver for the whole day
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              Whether you need multiple beach stops, restaurant wait-and-return service, or business transport in Stone Town, Ibrahim provides flexible hourly or full-day chauffeur hire.
            </p>
          </div>

          <a
            href={getWhatsAppLink(customTransferMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all shrink-0 hover:scale-105 active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Inquire on WhatsApp</span>
          </a>
        </section>
      </main>
    </div>
  );
}
