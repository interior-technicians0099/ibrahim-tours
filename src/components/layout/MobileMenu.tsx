'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarCheck,
  MessageCircle,
  Phone,
  X,
  ChevronRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { OPERATOR } from '@/lib/constants';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';

interface NavLink {
  name: string;
  href: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links?: NavLink[];
}

export default function MobileMenu({
  isOpen,
  onClose,
  links,
}: MobileMenuProps) {
  const pathname = usePathname();
  const { t, getLocalizedWhatsAppLink } = useLanguage();

  const defaultLinks: NavLink[] = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.tours'), href: '/tours' },
    { name: t('nav.transportation'), href: '/transportation' },
    { name: t('nav.reviews'), href: '/reviews' },
    { name: t('nav.faq'), href: '/faq' },
    { name: t('nav.contact'), href: '/contact' },
  ];

  const menuLinks = links || defaultLinks;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Slide-in Drawer Panel with RTL mirror */}
      <div className="absolute right-0 rtl:right-auto rtl:left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-2xl overflow-y-auto flex flex-col justify-between p-6 pt-4 animate-in slide-in-from-right rtl:slide-in-from-left duration-300">
        <div>
          {/* Header row with Brand & Close Button */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-3">
              <img
                src="/images/ibrahim-profile.webp"
                alt="Ibrahim"
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                  {OPERATOR.businessName}
                </span>
                <span className="text-[10px] text-sky-700 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <Award className="w-3 h-3" /> {t('common.licensedGuide')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition-all"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 mb-6" aria-label="Mobile Navigation">
            {menuLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center justify-between min-h-[44px] px-4 py-3 rounded-2xl text-sm font-extrabold transition-colors ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{link.name}</span>
                  <ChevronRight
                    className={`w-4 h-4 rtl:rotate-180 ${
                      isActive ? 'text-sky-600' : 'text-slate-300'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Mobile Language Switcher Section */}
          <div className="pt-4 border-t border-slate-100">
            <LanguageSelector variant="mobile" />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 mt-6 border-t border-slate-100 space-y-3">
          {/* Big Request Booking Button */}
          <Link
            href="/book"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 active:from-sky-700 active:to-blue-700 text-white font-extrabold text-sm shadow-md shadow-sky-600/25 active:scale-95 transition-all text-center"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{t('nav.bookRequest')}</span>
          </Link>

          {/* WhatsApp Direct Chat Button */}
          <a
            href={getLocalizedWhatsAppLink('default')}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-extrabold text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-center"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>{t('footer.chatWhatsApp')}</span>
          </a>

          {/* Operator Direct Phone */}
          <a
            href={`tel:${OPERATOR.phone}`}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-sky-600" />
            <span>{t('finalCta.orCall')} {OPERATOR.phone}</span>
          </a>

          {/* Trust strip */}
          <div className="pt-2 flex flex-col gap-2 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 justify-center bg-emerald-50 text-emerald-700 py-2 rounded-xl px-3 border border-emerald-100/50">
              <ShieldCheck className="w-4 h-4" />
              {t('common.securePaymentBadge')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
