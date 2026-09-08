import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Globe2,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  MapPin,
  HeartHandshake,
} from 'lucide-react';
import { OPERATOR } from '@/lib/constants';
import { getWhatsAppLink } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export default async function TrustIntro() {
  let traLicenseNumber: string | null = null;
  try {
    const operator = await prisma.operatorProfile.findFirst();
    const isNotExpired = !operator?.traLicenseExpiry || new Date(operator.traLicenseExpiry) > new Date();
    if (operator?.traLicenseNumber && isNotExpired) {
      traLicenseNumber = operator.traLicenseNumber;
    }
  } catch {
    traLicenseNumber = null;
  }

  return (
    <section className="py-20 bg-white relative overflow-hidden border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 rounded-3xl text-white p-6 sm:p-10 lg:p-14 shadow-2xl relative overflow-hidden">
          {/* Ambient Corner Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
            {/* Guide Avatar & Quick Stats (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="relative">
                {/* Guide Photo Placeholder Card */}
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-gradient-to-tr from-sky-600 to-amber-400 p-1.5 shadow-2xl">
                  <div className="w-full h-full rounded-[22px] bg-slate-800 flex flex-col items-center justify-center text-center p-4 relative overflow-hidden group">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-400 to-cyan-200 flex items-center justify-center text-slate-950 font-black text-3xl shadow-lg mb-3">
                      IT
                    </div>
                    <span className="font-extrabold text-xl text-white">
                      {OPERATOR.name}
                    </span>
                    <span className="text-xs text-amber-300 font-semibold tracking-wide">
                      Lead Licensed Guide & Owner
                    </span>
                    <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 text-[11px] font-extrabold text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{traLicenseNumber ? `TRA / ZCT Verified: ${traLicenseNumber}` : 'Zanzibar Tourism Certified'}</span>
                    </div>
                  </div>
                </div>

                {/* Experience Floating Badge */}
                <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 bg-amber-500 text-slate-950 py-2 px-3.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xl flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>{OPERATOR.experience}</span>
                </div>
              </div>

              {/* Location Tag */}
              <div className="mt-6 flex items-center gap-2 text-xs text-slate-300">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>Born & Based in {OPERATOR.location}</span>
              </div>
            </div>

            {/* Guide Bio & Trust Copy (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold tracking-wider uppercase mb-3">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Personalized Island Hospitality</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Meet Your Private Guide in Zanzibar
                </h2>
              </div>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Jambo! I am <strong>Ibrahim</strong>, a native Zanzibari with
                over a decade of experience guiding international travelers
                through the hidden wonders of our island. Unlike big impersonal
                booking agencies, I manage your tours directly to guarantee
                honest prices, safe vehicles, and memories that last a lifetime.
              </p>

              {/* Spoken Languages & Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {OPERATOR.trustPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/about"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95"
                >
                  <span>Meet Your Guide</span>
                  <ArrowRight className="w-4 h-4 text-sky-600" />
                </Link>

                <a
                  href={getWhatsAppLink(
                    'Hello Ibrahim! I would love to connect directly with you to plan our Zanzibar trip.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Chat with Ibrahim on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
