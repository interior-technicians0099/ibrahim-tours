import React from 'react';
import { Users, CheckCircle2, ShieldCheck, Car, Wind, Luggage } from 'lucide-react';
import { VEHICLES } from '@/lib/constants';

export default function VehicleFleet() {
  return (
    <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Licensed & Insured Fleet</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Our Private Vehicle Fleet
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Every vehicle is meticulously maintained, air-conditioned, clean, and operated by professional licensed drivers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {VEHICLES.map((vehicle) => (
          <div
            key={vehicle.id}
            className="rounded-3xl p-6 bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-sky-300 hover:shadow-md transition-all"
          >
            <div>
              {/* Header Icon & Capacity */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-sky-600">
                  <Car className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900">
                  {vehicle.capacity}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                {vehicle.name}
              </h3>

              {/* Feature bullets */}
              <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                {vehicle.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-sky-500" />
                Full Dual A/C
              </span>
              <span className="flex items-center gap-1">
                <Luggage className="w-3.5 h-3.5 text-amber-500" />
                Luggage Space
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
