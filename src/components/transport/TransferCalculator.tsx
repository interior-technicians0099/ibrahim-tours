'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Car,
  Plane,
  MapPin,
  Clock,
  Users,
  CalendarCheck,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Luggage,
} from 'lucide-react';
import { TRANSFER_ROUTES, VEHICLES } from '@/lib/constants';
import { formatPrice, getTransferWhatsAppLink } from '@/lib/utils';

export default function TransferCalculator() {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    TRANSFER_ROUTES[0].id
  );
  const [selectedVehicleType, setSelectedVehicleType] = useState<
    'van1to3' | 'van4to6' | 'miniBus7to12' | 'bigBus13to25'
  >('van1to3');

  const selectedRoute = useMemo(() => {
    return (
      TRANSFER_ROUTES.find((r) => r.id === selectedRouteId) ||
      TRANSFER_ROUTES[0]
    );
  }, [selectedRouteId]);

  const currentPrice = selectedRoute.pricing[selectedVehicleType];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl relative overflow-hidden">
      {/* Decorative Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Title */}
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Car className="w-3.5 h-3.5" />
            <span>Instant Fare Estimator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Calculate Your Private Transfer Fare
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Fixed transparent pricing with zero surprise surcharges or airport parking fees.
          </p>
        </div>

        {/* Route Selector Dropdown & Quick Switcher */}
        <div className="space-y-4">
          <label
            htmlFor="route-select"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
          >
            1. Select Your Route
          </label>
          <select
            id="route-select"
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          >
            {TRANSFER_ROUTES.map((route) => (
              <option key={route.id} value={route.id}>
                {route.origin} → {route.destination} ({route.durationEstimate} • {route.distanceKm} km)
              </option>
            ))}
          </select>
        </div>

        {/* Vehicle Tier Selection */}
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. Choose Vehicle Size & Passenger Count
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Van 1-3 */}
            <button
              type="button"
              onClick={() => setSelectedVehicleType('van1to3')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                selectedVehicleType === 'van1to3'
                  ? 'bg-sky-50/80 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  Private Van
                </span>
                <span className="text-xs text-slate-500">1–3 Passengers</span>
              </div>
              <div className="mt-3 text-lg font-black text-slate-900">
                {formatPrice(selectedRoute.pricing.van1to3)}
              </div>
            </button>

            {/* Van 4-6 */}
            <button
              type="button"
              onClick={() => setSelectedVehicleType('van4to6')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                selectedVehicleType === 'van4to6'
                  ? 'bg-sky-50/80 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  Family Van
                </span>
                <span className="text-xs text-slate-500">4–6 Passengers</span>
              </div>
              <div className="mt-3 text-lg font-black text-slate-900">
                {formatPrice(selectedRoute.pricing.van4to6)}
              </div>
            </button>

            {/* Mini Bus 7-12 */}
            <button
              type="button"
              onClick={() => setSelectedVehicleType('miniBus7to12')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                selectedVehicleType === 'miniBus7to12'
                  ? 'bg-sky-50/80 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  Executive Mini Bus
                </span>
                <span className="text-xs text-slate-500">7–12 Passengers</span>
              </div>
              <div className="mt-3 text-lg font-black text-slate-900">
                {formatPrice(selectedRoute.pricing.miniBus7to12)}
              </div>
            </button>

            {/* Big Bus 13-25 */}
            <button
              type="button"
              onClick={() => setSelectedVehicleType('bigBus13to25')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                selectedVehicleType === 'bigBus13to25'
                  ? 'bg-sky-50/80 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  Tourist Big Bus
                </span>
                <span className="text-xs text-slate-500">13–25 Passengers</span>
              </div>
              <div className="mt-3 text-lg font-black text-slate-900">
                {formatPrice(selectedRoute.pricing.bigBus13to25)}
              </div>
            </button>
          </div>
        </div>

        {/* Calculation Result & Route Overview Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Private AC Vehicle • Pay on Arrival</span>
            </div>

            <div className="text-lg sm:text-xl font-bold text-white flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span>{selectedRoute.origin}</span>
              <ArrowRight className="w-4 h-4 text-sky-400" />
              <span>{selectedRoute.destination}</span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Est. {selectedRoute.durationEstimate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Distance: {selectedRoute.distanceKm} km
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Luggage className="w-3.5 h-3.5 text-emerald-400" />
                Luggage Included
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end shrink-0">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">
              Total Fixed Fare
            </span>
            <span className="text-4xl font-black text-white">
              {formatPrice(currentPrice)}
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold">
              No Advance Prepayment Required
            </span>
          </div>
        </div>

        {/* Dual CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/book?transfer=${encodeURIComponent(
              `${selectedRoute.origin} to ${selectedRoute.destination}`
            )}`}
            className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-sm shadow-lg shadow-sky-600/25 active:scale-95 transition-all text-center"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Request This Transfer</span>
          </Link>

          <a
            href={getTransferWhatsAppLink(
              selectedRoute.origin,
              selectedRoute.destination
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 active:scale-95 transition-all text-center"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Book Directly on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
