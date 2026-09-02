import React from 'react';
import { Vehicle } from '@/lib/types';
import { Car, Users, CheckCircle2, Wind, Luggage, ShieldCheck } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-sky-300 transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Header Icon & Capacity Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Car className="w-6 h-6" />
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200/60">
            {vehicle.capacity}
          </span>
        </div>

        {/* Vehicle Name */}
        <h3 className="font-extrabold text-slate-900 text-lg mb-1 group-hover:text-sky-600 transition-colors">
          {vehicle.name}
        </h3>
        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Licensed Commercial Tourism Vehicle</span>
        </span>

        {/* Feature list */}
        <ul className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
          {vehicle.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer Amenities */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
        <span className="flex items-center gap-1.5 text-slate-600">
          <Wind className="w-3.5 h-3.5 text-sky-500" />
          High-Power A/C
        </span>
        <span className="flex items-center gap-1.5 text-slate-600">
          <Luggage className="w-3.5 h-3.5 text-amber-500" />
          Luggage Boot
        </span>
      </div>
    </div>
  );
}
