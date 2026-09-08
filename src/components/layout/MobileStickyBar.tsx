'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, MessageCircle, Phone } from 'lucide-react';
import { OPERATOR } from '@/lib/constants';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function MobileStickyBar() {
  const pathname = usePathname();
  const { t, getLocalizedWhatsAppLink } = useLanguage();

  // Hide on admin/operator portals and on the book page itself where the user is already booking
  if (
    pathname?.startsWith('/platform') ||
    pathname?.startsWith('/operator') ||
    pathname?.startsWith('/login') ||
    pathname === '/book'
  ) {
    return null;
  }

  return (
    <aside
      aria-label="Mobile quick actions bar"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 py-2.5 px-3 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] md:hidden touch-manipulation"
    >
      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
        {/* 1. Request Booking */}
        <Link
          href="/book"
          className="flex flex-col items-center justify-center min-h-[44px] py-1.5 px-2 rounded-2xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-extrabold text-[11px] shadow-sm shadow-sky-600/20 active:scale-95 transition-all text-center"
        >
          <CalendarCheck className="w-4 h-4 mb-0.5" />
          <span>{t('mobileBar.bookNow')}</span>
        </Link>

        {/* 2. WhatsApp Direct */}
        <a
          href={getLocalizedWhatsAppLink('default')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center min-h-[44px] py-1.5 px-2 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-extrabold text-[11px] shadow-sm shadow-emerald-500/20 active:scale-95 transition-all text-center"
          aria-label="WhatsApp with prefilled message"
        >
          <MessageCircle className="w-4 h-4 fill-current mb-0.5" />
          <span>{t('mobileBar.whatsApp')}</span>
        </a>

        {/* 3. Call Guide Direct */}
        <a
          href={`tel:${OPERATOR.phone.replace(/\s+/g, '')}`}
          className="flex flex-col items-center justify-center min-h-[44px] py-1.5 px-2 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-extrabold text-[11px] shadow-sm active:scale-95 transition-all text-center"
          aria-label={`Call Ibrahim directly at ${OPERATOR.phone}`}
        >
          <Phone className="w-4 h-4 text-sky-400 mb-0.5" />
          <span>{t('mobileBar.callGuide') || 'Call Guide'}</span>
        </a>
      </div>
    </aside>
  );
}
