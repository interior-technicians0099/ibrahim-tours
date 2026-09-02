import React from 'react';
import Link from 'next/link';
import {
  Car,
  Plane,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  MessageCircle,
  Users,
  ChevronRight,
  Info,
  Luggage,
  Wind,
  Smile,
  Baby,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { TransferRoute } from '@/lib/types';
import { TRANSFER_ROUTES, OPERATOR } from '@/lib/constants';
import { formatPrice, getTransferWhatsAppLink } from '@/lib/utils';
import TransferCard from '@/components/transport/TransferCard';

interface TransferDetailProps {
  route: TransferRoute;
}

export default function TransferDetail({ route }: TransferDetailProps) {
  // 3 other routes
  const otherRoutes = TRANSFER_ROUTES.filter((r) => r.id !== route.id).slice(0, 3);

  const routeTitle = `${route.origin} to ${route.destination}`;

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
            className="flex items-center gap-2 text-xs text-slate-400 mb-6 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <Link href="/transportation" className="hover:text-white transition-colors">
              Transportation & Transfers
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-sky-300 font-semibold">{routeTitle}</span>
          </nav>

          <div className="max-w-4xl space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-bold uppercase tracking-wider">
                <Car className="w-3.5 h-3.5 text-sky-400" />
                <span>Private Direct Transfer</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Est. {route.durationEstimate}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5" />
                <span>{route.distanceKm} km Distance</span>
              </span>
            </div>

            {/* Route Title */}
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {route.origin} <span className="text-sky-400">→</span> {route.destination}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Fixed transparent pricing with zero upfront deposit. Private air-conditioned door-to-door transfer with free flight tracking and airport meet & greet.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Main Content Column (8 cols) */}
          <div className="lg:col-span-8 space-y-10">
            {/* 2. Full Pricing Table with 4 Rows */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block">
                    Fixed Rates
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    Vehicle Tiers & Pricing
                  </h2>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold self-start sm:self-auto border border-emerald-200/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Price is per vehicle, NOT per person</span>
                </div>
              </div>

              {/* Pricing Rows */}
              <div className="space-y-3">
                {/* Row 1: Van 1-3 */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white text-sky-600 border border-slate-200/60 flex items-center justify-center font-bold text-sm shrink-0">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">
                          Private Tourist Van
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                          1–3 Passengers
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Comfortable Toyota Alphard / Noah with dual AC & luggage space
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 shrink-0 flex sm:flex-col items-baseline sm:items-end justify-between">
                    <span className="text-2xl font-black text-slate-900">
                      {formatPrice(route.pricing.van1to3)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Total per vehicle
                    </span>
                  </div>
                </div>

                {/* Row 2: Van 4-6 */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white text-amber-600 border border-slate-200/60 flex items-center justify-center font-bold text-sm shrink-0">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">
                          Private Tourist Van (Large)
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          4–6 Passengers
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Spacious Toyota HiAce with ample boot capacity for larger luggage
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 shrink-0 flex sm:flex-col items-baseline sm:items-end justify-between">
                    <span className="text-2xl font-black text-slate-900">
                      {formatPrice(route.pricing.van4to6)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Total per vehicle
                    </span>
                  </div>
                </div>

                {/* Row 3: Mini Bus 7-12 */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 border border-slate-200/60 flex items-center justify-center font-bold text-sm shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">
                          Private Mini Bus
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          7–12 Passengers
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Toyota Coaster Mini Bus with high roof, PA system, and dual AC
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 shrink-0 flex sm:flex-col items-baseline sm:items-end justify-between">
                    <span className="text-2xl font-black text-emerald-700">
                      {formatPrice(route.pricing.miniBus7to12)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Total per vehicle
                    </span>
                  </div>
                </div>

                {/* Row 4: Big Bus 13-25 */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 border border-slate-200/60 flex items-center justify-center font-bold text-sm shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">
                          Private Big Coach Bus
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          13–25 Passengers
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Full-size tourist coach with undercarriage luggage holds
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 shrink-0 flex sm:flex-col items-baseline sm:items-end justify-between">
                    <span className="text-2xl font-black text-indigo-700">
                      {formatPrice(route.pricing.bigBus13to25)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Total per vehicle
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. What's Included */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                  Complimentary Amenities
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  What's Included with Every Transfer
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Professional licensed Zanzibari driver</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Full air-conditioned private vehicle</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Airport meet & greet with name signboard</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Generous luggage space & heavy bag handling</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Child safety seats on request (complimentary)</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Free waiting time if flight/ferry is delayed</span>
                </div>
              </div>
            </section>

            {/* 4. Pickup Notes & Arrival Instructions */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-600" />
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Pickup & Meeting Instructions
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Plane className="w-4 h-4 text-sky-600" />
                    <span>Airport (ZNZ) Pickups</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed text-xs">
                    Your driver will be waiting just outside the customs exit doors holding an official sign with your name. We track your flight number in real-time, so delays are accommodated automatically.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>Hotel & Resort Departures</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed text-xs">
                    Your driver will arrive at your resort reception or villa gate 15 minutes before the scheduled time and assist with loading all luggage into the vehicle.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* 5. Sidebar CTA Block (4 cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <span>Starting From</span>
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Pay on Arrival
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-slate-900">
                    {formatPrice(route.pricing.van1to3)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    (Private Van 1–3)
                  </span>
                </div>
              </div>

              {/* Trust checklist */}
              <div className="space-y-2.5 py-4 border-y border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Private vehicle transfer</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No prepayment or credit card needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Free cancellation up to 12h before</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct WhatsApp confirmation within 30 min</span>
                </div>
              </div>

              {/* TWO Prominent CTAs */}
              <div className="space-y-3">
                <Link
                  href={`/book?type=transport&route=${encodeURIComponent(route.id)}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-sm shadow-lg shadow-sky-600/25 active:scale-95 transition-all text-center"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Request Booking</span>
                </Link>

                <a
                  href={getTransferWhatsAppLink(route.origin, route.destination)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all text-center"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>

              {/* Contact direct */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                <span>Direct Dispatch: </span>
                <a
                  href={`tel:${OPERATOR.phone}`}
                  className="font-bold text-slate-900 hover:text-sky-600"
                >
                  {OPERATOR.phone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Other Transfer Routes Section */}
        {otherRoutes.length > 0 && (
          <section className="pt-8 border-t border-slate-200/80 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                  Explore More Destinations
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Other Popular Island Routes
                </h2>
              </div>

              <Link
                href="/transportation"
                className="inline-flex items-center gap-1 text-sm font-bold text-sky-600 hover:text-sky-800"
              >
                <span>View All 12 Routes</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherRoutes.map((otherRoute) => (
                <TransferCard key={otherRoute.id} route={otherRoute} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
