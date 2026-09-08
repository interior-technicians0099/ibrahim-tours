'use client';

import React from 'react';
import {
  BadgePercent,
  CalendarCheck,
  Sparkles,
  Compass,
  CheckCircle,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function WhyChooseOperator() {
  const { t } = useLanguage();

  const trustCards = [
    {
      icon: <Compass className="w-6 h-6 text-sky-600" />,
      title: t('whyChoose.feature1Title'),
      description: t('whyChoose.feature1Desc'),
      badge: t('whyChoose.feature1Badge'),
    },
    {
      icon: <Sparkles className="w-6 h-6 text-indigo-600" />,
      title: t('whyChoose.feature2Title'),
      description: t('whyChoose.feature2Desc'),
      badge: t('whyChoose.feature2Badge'),
    },
    {
      icon: <BadgePercent className="w-6 h-6 text-emerald-600" />,
      title: t('whyChoose.feature3Title'),
      description: t('whyChoose.feature3Desc'),
      badge: t('whyChoose.feature3Badge'),
    },
    {
      icon: <CalendarCheck className="w-6 h-6 text-amber-600" />,
      title: t('whyChoose.feature4Title'),
      description: t('whyChoose.feature4Desc'),
      badge: t('whyChoose.feature4Badge'),
    },
  ];

  return (
    <section className="py-20 bg-white border-t border-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
            {t('whyChoose.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
            {t('whyChoose.title')}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            {t('whyChoose.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustCards.map((card, i) => (
            <div
              key={i}
              className="bg-slate-50 rounded-3xl p-7 border border-slate-200/80 hover:border-sky-300 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-200/60 text-slate-700">
                    {card.badge}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                  {card.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verified Standard</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
