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
  Sparkles,
  Users,
  Compass,
} from 'lucide-react';
import { TRANSFER_ROUTES, VEHICLES, OPERATOR } from '@/lib/constants';
import { getWhatsAppLink, formatPrice } from '@/lib/utils';
import VehicleCard from '@/components/transport/VehicleCard';
import TransferCard from '@/components/transport/TransferCard';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { Locale } from '@/lib/i18n/types';

export const metadata: Metadata = {
  title: 'Transportation & Transfers | Private Zanzibar Taxi & Airport Pickup',
  description:
    'Reliable private airport transfers and island-wide taxi services in Zanzibar with Ibrahim. Clean AC vans and buses, fixed transparent prices, free airport meet & greet, and verified direct booking.',
};

export default async function TransportationPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value as Locale) || 'en';
  const dict = getDictionary(locale);

  const popularRouteIds = ['trans-1', 'trans-2', 'trans-3'];
  const popularRoutes = TRANSFER_ROUTES.filter((r) => popularRouteIds.includes(r.id));
  const otherRoutes = TRANSFER_ROUTES.filter((r) => !popularRouteIds.includes(r.id));

  const customTransferMsg =
    'Hello Ibrahim! I need a private driver / transfer service in Zanzibar. Can you provide availability and a quote?';

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. Header Banner */}
      <section className="relative bg-gradient-to-b from-sky-950 via-slate-900 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Glows */}
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
              {dict.nav.home}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 rtl:rotate-180" />
            <span className="text-sky-300 font-semibold">{dict.nav.transportation}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-bold uppercase tracking-wider mb-4">
              <Car className="w-4 h-4 text-sky-400" />
              <span>{dict.hero.badgePrivate} • {dict.common.licensedGuide}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {dict.nav.transportation}
            </h1>

            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              {dict.booking.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-4 text-xs font-semibold text-slate-200">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <Plane className="w-4 h-4 text-sky-400" />
                <span>Free Airport Meet & Greet</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{dict.featuredTours.securePayment}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>24/7 Flight Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24 space-y-16">
        {/* 2. Vehicle Cards Section */}
        <section className="space-y-6">
          <div className="text-center sm:text-left">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
              Our Modern Fleet
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Private Vehicles for Every Group Size
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              All vehicles are licensed, fully insured, sanitized before each trip, and equipped with powerful dual air conditioning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VEHICLES.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </section>

        {/* 3. Popular Transfer Routes Highlight */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200/60">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Top Booked Connections</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Most Popular Airport & Resort Routes
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularRoutes.map((route) => (
              <TransferCard key={route.id} route={route} isPopular={true} />
            ))}
          </div>
        </section>

        {/* 4. Grid of All 12 Transfer Routes */}
        <section className="space-y-6">
          <div className="text-center sm:text-left">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
              Complete Route Directory
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              All 12 Fixed-Rate Island Transfers
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Direct door-to-door pricing with zero hidden surcharges for fuel or luggage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRANSFER_ROUTES.map((route) => (
              <TransferCard key={route.id} route={route} />
            ))}
          </div>
        </section>

        {/* 5. CTA Band: "Need a private driver?" */}
        <section className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Car className="w-3.5 h-3.5 text-sky-400" />
              <span>Full-Day Chauffeur & Custom Stops</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Need a dedicated private driver for the day?
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Hire Ibrahim or our professional drivers for flexible hourly or whole-day hire. Perfect for exploring remote beaches, hopping between restaurants, or attending business meetings in Stone Town.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/book?type=transfer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition-all active:scale-95 text-center"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Book a Transfer</span>
            </Link>

            <a
              href={getWhatsAppLink(customTransferMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95 text-center"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Inquire on WhatsApp</span>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
