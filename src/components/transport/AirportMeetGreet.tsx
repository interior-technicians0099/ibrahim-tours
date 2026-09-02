import React from 'react';
import {
  Plane,
  Clock,
  Luggage,
  ShieldCheck,
  CheckCircle2,
  Smile,
  Sparkles,
} from 'lucide-react';

export default function AirportMeetGreet() {
  return (
    <section className="bg-gradient-to-br from-sky-950 via-slate-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Plane className="w-3.5 h-3.5" />
            <span>Zanzibar Airport (ZNZ) Transfers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            VIP Meet & Greet Service Included
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Never worry about getting lost or negotiating with unregulated airport taxi touts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Live Flight Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We monitor your inbound flight in real-time. If your plane is delayed, your driver adjusts pickup automatically at zero extra cost.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              <Smile className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Name Board Welcome</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your private driver waits right outside the arrivals terminal exit holding a clear sign with your name.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              <Luggage className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Luggage Assistance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Assistance with your heavy bags straight from the terminal to the air-conditioned vehicle boot.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Complimentary Water</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chilled sealed bottles of mineral water waiting inside the vehicle to refresh you after a long flight.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
