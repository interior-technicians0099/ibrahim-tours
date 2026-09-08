'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  MessageCircle,
  ShieldCheck,
  Phone,
  Mail,
  Sparkles,
} from 'lucide-react';
import { OPERATOR } from '@/lib/constants';
import { getWhatsAppLink } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function FinalCTA() {
  const { t } = useLanguage();
  const whatsAppMsg = t('whatsapp.defaultGreeting');

  return (
    <section className="py-20 bg-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-sky-900 via-blue-900 to-slate-900 rounded-3xl p-8 sm:p-12 lg:p-16 text-white text-center shadow-2xl relative overflow-hidden">
          {/* Ambient Lighting Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

          <div className="max-w-3xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs sm:text-sm font-bold mb-6">
              <Sparkles className="w-4 h-4" />
              <span>{t('whyChoose.feature2Badge')} • {t('common.licensedGuide')}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {t('finalCta.title')}
            </h2>

            <p className="mt-4 text-slate-200 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
              {t('finalCta.description')}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
              <Link
                href="/book"
                className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <CalendarCheck className="w-5 h-5" />
                <span>{t('finalCta.bookOnline')}</span>
              </Link>

              <a
                href={getWhatsAppLink(whatsAppMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-extrabold text-base shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>{t('finalCta.chatWhatsApp')}</span>
              </a>
            </div>

            {/* Quick Contact Footer Strip */}
            <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
              <a
                href={`tel:${OPERATOR.phone}`}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('finalCta.orCall')} {OPERATOR.phone}</span>
              </a>
              <span className="hidden sm:inline text-slate-500">•</span>
              <a
                href={`mailto:${OPERATOR.email}`}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span>{OPERATOR.email}</span>
              </a>
              <span className="hidden sm:inline text-slate-500">•</span>
              <span className="flex items-center gap-1.5 text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('common.licensedGuide')} • {OPERATOR.location}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
