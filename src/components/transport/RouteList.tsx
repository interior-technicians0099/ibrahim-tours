import React from 'react';
import Link from 'next/link';
import {
  Plane,
  MapPin,
  Clock,
  CalendarCheck,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { TRANSFER_ROUTES } from '@/lib/constants';
import { formatPrice, getTransferWhatsAppLink } from '@/lib/utils';

export default function RouteList() {
  return (
    <section className="space-y-6">
      <div className="text-center sm:text-left">
        <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
          Complete Price Index
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          All 12 Fixed-Rate Transfer Routes
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Direct, private, door-to-door transportation across all Zanzibar regions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TRANSFER_ROUTES.map((route) => (
          <div
            key={route.id}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-sky-300 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Est. {route.durationEstimate}</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {route.distanceKm} km
                </span>
              </div>

              {/* Origin -> Destination */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                  <span>{route.origin}</span>
                </div>
                <div className="w-0.5 h-3 bg-slate-200 ml-1" />
                <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span>{route.destination}</span>
                </div>
              </div>

              {/* Pricing Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-2xl text-center text-xs mb-6">
                <div className="p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Van 1–3
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatPrice(route.pricing.van1to3)}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Van 4–6
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatPrice(route.pricing.van4to6)}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Mini Bus 7–12
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatPrice(route.pricing.miniBus7to12)}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Big Bus 13–25
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatPrice(route.pricing.bigBus13to25)}
                  </span>
                </div>
              </div>
            </div>

            {/* Dual CTAs */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href={`/book?transfer=${encodeURIComponent(
                  `${route.origin} to ${route.destination}`
                )}`}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors text-center"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Book Route</span>
              </Link>

              <a
                href={getTransferWhatsAppLink(route.origin, route.destination)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-xs transition-colors text-center"
                aria-label={`Inquire about transfer from ${route.origin} to ${route.destination} on WhatsApp`}
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
