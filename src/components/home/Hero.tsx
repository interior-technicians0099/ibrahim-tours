import React from 'react';
import Link from 'next/link';
import {
  Compass,
  CalendarCheck,
  MessageCircle,
  ShieldCheck,
  Star,
  Award,
  Globe2,
  Anchor,
  ChevronDown,
} from 'lucide-react';
import { OPERATOR } from '@/lib/constants';
import { getWhatsAppLink } from '@/lib/utils';

export default function Hero() {
  const heroWhatsAppMessage =
    'Hello Ibrahim! I am planning a holiday in Zanzibar and would like to explore your tour options and airport transfers.';

  return (
    <section className="relative min-h-[90vh] lg:min-h-[92vh] flex items-center justify-center bg-gradient-to-b from-sky-950 via-slate-900 to-slate-950 text-white overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Decorative Tropical & Ocean Ambient Light Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle Pattern Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10 flex flex-col items-center">
        {/* Top Trust Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-sky-200 text-xs sm:text-sm font-semibold mb-8 shadow-lg shadow-black/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Local Licensed Guide in Zanzibar • {OPERATOR.experience}</span>
          <span className="hidden sm:inline text-amber-400">• 5.0 ★★★★★</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12] sm:leading-[1.1] max-w-4xl">
          Discover Paradise with{' '}
          <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
            Ibrahim Tours
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
          Authentic private excursions, Mnemba dolphin safaris, historic Stone
          Town walking tours, and reliable island-wide airport transfers.
          <span className="block mt-1 text-amber-300 font-medium text-sm sm:text-base">
            ✨ No upfront payment required • Pay safely on arrival.
          </span>
        </p>

        {/* Call to Actions (Explore Tours + WhatsApp) */}
        <div className="mt-9 w-full flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md">
          {/* Explore Tours CTA */}
          <Link
            href="#featured-tours"
            className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-base shadow-xl shadow-sky-600/30 hover:shadow-sky-500/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Compass className="w-5 h-5" />
            <span>Explore Tours</span>
          </Link>

          {/* WhatsApp CTA */}
          <a
            href={getWhatsAppLink(heroWhatsAppMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-bold text-base shadow-xl shadow-emerald-600/25 hover:shadow-emerald-500/35 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>WhatsApp Us</span>
          </a>
        </div>

        {/* 4 Trust Highlights Badges */}
        <div className="mt-14 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-4xl text-left">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 backdrop-blur-xs border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs text-slate-400">Experience</span>
              <span className="text-sm font-bold text-white">10+ Years Guide</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 backdrop-blur-xs border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs text-slate-400">Accredited</span>
              <span className="text-sm font-bold text-white">Licensed Operator</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 backdrop-blur-xs border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs text-slate-400">Languages</span>
              <span className="text-sm font-bold text-white">EN • SW • IT</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 backdrop-blur-xs border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs text-slate-400">Booking</span>
              <span className="text-sm font-bold text-white">Pay on Arrival</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-10 hidden sm:flex flex-col items-center gap-1 text-slate-400 animate-bounce">
          <span className="text-[11px] font-semibold tracking-wider uppercase">Scroll to explore</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </section>
  );
}
