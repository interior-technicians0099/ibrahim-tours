'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  ChevronDown,
  MessageCircle,
  ChevronRight,
} from 'lucide-react';
import { FAQ_ITEMS } from '@/lib/constants';
import { getWhatsAppLink } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t } = useLanguage();

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqWhatsAppMsg = t('whatsapp.faqQuestion');

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. Header Banner */}
      <section className="relative bg-gradient-to-b from-sky-950 via-slate-900 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <nav
            className="flex items-center gap-2 text-xs text-slate-400 mb-6"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white transition-colors">
              {t('nav.home')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 rtl:rotate-180" />
            <span className="text-sky-300 font-semibold">{t('faq.title')}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-bold uppercase tracking-wider mb-4">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span>{t('faq.title')}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {t('faq.title')}
            </h1>

            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              {t('faq.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24 space-y-12">
        {/* Accordion Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl space-y-4">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {t('faq.title')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('faq.subtitle')}
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openIndex === index;
              const questionText = t(`faq.q${faq.id}`) || faq.question;
              const answerText = t(`faq.a${faq.id}`) || faq.answer;

              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-sky-300 bg-sky-50/40 shadow-xs'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 sm:p-6 text-left rtl:text-right flex items-center justify-between gap-4 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {questionText}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isOpen
                          ? 'bg-sky-600 text-white rotate-180'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-6 sm:px-6 sm:pb-6 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-sky-100/60 pt-4 animate-in fade-in">
                      <p>{answerText}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* WhatsApp Help Banner */}
        <section className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left rtl:md:text-right max-w-lg">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {t('common.language')} & Support
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {t('faq.whatsAppBannerTitle')}
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm">
              {t('faq.whatsAppBannerDesc')}
            </p>
          </div>

          <a
            href={getWhatsAppLink(faqWhatsAppMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all shrink-0 hover:scale-105 active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>{t('faq.chatWhatsApp')}</span>
          </a>
        </section>
      </main>
    </div>
  );
}
