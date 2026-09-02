import React from 'react';
import Link from 'next/link';
import {
  Clock,
  MapPin,
  Car,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { TransferRoute } from '@/lib/types';
import { formatPrice, getTransferWhatsAppLink } from '@/lib/utils';

interface TransferCardProps {
  route: TransferRoute;
  isPopular?: boolean;
}

export default function TransferCard({ route, isPopular = false }: TransferCardProps) {
  const lowestPrice = Math.min(
    route.pricing.van1to3,
    route.pricing.van4to6,
    route.pricing.miniBus7to12,
    route.pricing.bigBus13to25
  );

  return (
    <article
      id={route.id}
      className={`bg-white rounded-3xl p-6 border shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group ${
        isPopular ? 'border-sky-300 ring-1 ring-sky-200' : 'border-slate-200/80 hover:border-sky-300'
      }`}
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>Est. {route.durationEstimate}</span>
          </div>

          <div className="flex items-center gap-2">
            {isPopular && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                Popular Route
              </span>
            )}
            <span className="text-xs font-semibold text-slate-400">
              {route.distanceKm} km
            </span>
          </div>
        </div>

        {/* Origin -> Destination Flow */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
            <span>{route.origin}</span>
          </div>
          <div className="w-0.5 h-3.5 bg-slate-200 ml-1" />
          <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span>{route.destination}</span>
          </div>
        </div>

        {/* Price & Vehicle Preview */}
        <div className="p-3.5 bg-slate-50 rounded-2xl mb-6 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Private Van (1–3 Pax)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">
                {formatPrice(route.pricing.van1to3)}
              </span>
              <span className="text-xs text-slate-500">/ vehicle</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Mini Bus (7–12)
            </span>
            <span className="text-sm font-bold text-emerald-700">
              {formatPrice(route.pricing.miniBus7to12)}
            </span>
          </div>
        </div>
      </div>

      {/* TWO CTAs: [View Details] + [WhatsApp] */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <Link
          href={`/transportation/${route.id}`}
          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs shadow-xs transition-colors text-center"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        <a
          href={getTransferWhatsAppLink(route.origin, route.destination)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-bold text-xs shadow-xs shadow-emerald-500/20 transition-colors text-center"
          aria-label={`Inquire about transfer from ${route.origin} to ${route.destination} on WhatsApp`}
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
          <span>WhatsApp</span>
        </a>
      </div>
    </article>
  );
}
