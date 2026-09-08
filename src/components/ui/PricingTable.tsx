import React from 'react';
import { TourPricingTier } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Users, User, Heart, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PricingTableProps {
  pricing: TourPricingTier;
  tourTitle: string;
}

export default function PricingTable({ pricing, tourTitle }: PricingTableProps) {
  return (
    <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block">
            Transparent Pricing
          </span>
          <h3 className="text-xl font-extrabold text-slate-900">
            Public Rates & Group Tiers
          </h3>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zero Hidden Fees • Full Payment Required</span>
        </div>
      </div>

      {/* Pricing Matrix Rows */}
      <div className="space-y-3">
        {/* Tier 1: Single */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                Solo Traveler (1 Person)
              </span>
              <span className="text-xs text-slate-500">Private vehicle & guide charter</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-slate-900 block">
              {formatPrice(pricing.single)}
            </span>
            <span className="text-[11px] text-slate-400">Total for 1 Person</span>
          </div>
        </div>

        {/* Tier 2: Couple */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                Couple / 2 Persons
              </span>
              <span className="text-xs text-slate-500">Most popular for partners & friends</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-slate-900 block">
              {formatPrice(pricing.couple)}
            </span>
            <span className="text-[11px] text-slate-400">Total for 2 Persons</span>
          </div>
        </div>

        {/* Tier 3: Group 5-10 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                Group (5–10 Persons)
              </span>
              <span className="text-xs text-slate-500">Per-person rate for medium groups</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-emerald-700 block">
              {formatPrice(pricing.group5to10)}
            </span>
            <span className="text-[11px] text-slate-400">per person</span>
          </div>
        </div>

        {/* Tier 4: Group 20 (if available) */}
        {pricing.group20 && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  Large Group (20 Persons)
                </span>
                <span className="text-xs text-slate-500">Discounted big bus charter rate</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-emerald-700 block">
                {formatPrice(pricing.group20)}
              </span>
              <span className="text-[11px] text-slate-400">per person</span>
            </div>
          </div>
        )}
      </div>

      {/* Guarantee Footer */}
      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 text-xs text-slate-500 border-t border-slate-200/60">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Marine & park fees included
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Roundtrip hotel pickup included
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          No credit card needed online
        </span>
      </div>
    </div>
  );
}
