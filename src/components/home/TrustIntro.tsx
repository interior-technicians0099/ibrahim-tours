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
  Building,
} from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';
import { getCompanyProfile } from '@/lib/company';

export default async function TrustIntro() {
  const company = await getCompanyProfile();

  const isNotExpired =
    !company.traLicenseExpiry || new Date(company.traLicenseExpiry) > new Date();
  const traLicenseNumber =
    company.traLicenseNumber && isNotExpired ? company.traLicenseNumber : null;

  const brandWhatsapp = company.officialWhatsapp || company.whatsapp;
  const whatsAppMsg = `Hello ${company.companyName}! I would love to connect directly with your team to plan our Zanzibar trip.`;

  return (
    <section className="py-20 bg-white relative overflow-hidden border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 rounded-3xl text-white p-6 sm:p-10 lg:p-14 shadow-2xl relative overflow-hidden">
          {/* Ambient Corner Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
            {/* Company Visual Brand Card (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="relative">
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-sky-600 p-1.5 shadow-2xl">
                  <div className="w-full h-full rounded-[22px] bg-slate-800 flex flex-col items-center justify-center text-center p-4 relative overflow-hidden group">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center shadow-lg mb-3">
                      <img
                        src={company.logoUrl || '/branding/zansafari-logo.png'}
                        alt={company.companyName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-extrabold text-xl text-white">
                      {company.companyName}
                    </span>
                    <span className="text-xs text-amber-300 font-semibold tracking-wide">
                      {company.tagline}
                    </span>
                    <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 text-[11px] font-extrabold text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {traLicenseNumber
                          ? `TRA Licensed: ${traLicenseNumber}`
                          : 'Zanzibar Tourism Certified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Experience Floating Badge */}
                <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 bg-amber-500 text-slate-950 py-2 px-3.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xl flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>10+ Years Heritage</span>
                </div>
              </div>

              {/* Company Registration & Location Tag */}
              <div className="mt-6 flex flex-col gap-1 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Headquartered in Stone Town, Zanzibar</span>
                </div>
                {company.registrationNumber && (
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Company Reg: {company.registrationNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Copy (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold tracking-wider uppercase mb-3">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Personalized Island Hospitality</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Welcome to {company.companyName}
                </h2>
              </div>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Karibu sana! <strong>{company.companyName}</strong> is a registered Zanzibar tour company and safari specialist. With over a decade of operational excellence, our dedicated multilingual team and veteran certified guides deliver private excursions, dhow marine adventures, and reliable airport transfers with genuine Swahili hospitality.
              </p>

              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Fully registered Zanzibar tour company & TRA licensed</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Expert licensed guides & local native specialists</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Multilingual team: English, Swahili, Italian, French, German</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Direct instant WhatsApp booking & 24/7 dedicated support</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/about"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95"
                >
                  <span>About Our Company</span>
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                </Link>

                <a
                  href={getWhatsAppLink(whatsAppMsg, brandWhatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
