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
import { CompanyProfileData } from '@/lib/company';
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
  company?: CompanyProfileData;
}

export default function MobileMenu({
  isOpen,
  onClose,
  links,
  company,
}: MobileMenuProps) {
  const pathname = usePathname();
  const { t, getLocalizedWhatsAppLink } = useLanguage();

  const brandName = company?.companyName || company?.businessName || OPERATOR.name;
  const brandBusinessName = company?.businessName || company?.companyName || OPERATOR.businessName;
  const brandLogo = company?.logoUrl || OPERATOR.logoUrl || '/branding/zansafari-logo.png';
  const brandPhone = company?.officialPhone || company?.phone || OPERATOR.phone;

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

  // Auto-close drawer ONLY when pathname actually changes
  const prevPathname = React.useRef(pathname);
  React.useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle navigation smoothly without aborting router navigation
  const handleNavClick = (href: string) => {
    if (pathname === href) {
      onClose();
    } else {
      setTimeout(() => {
        onClose();
      }, 250);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden bg-slate-950/70 backdrop-blur-md transition-opacity duration-200 touch-manipulation"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop tap to close */}
      <div
        className="absolute inset-0 z-0 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Drawer Panel with RTL mirror */}
      <div className="relative z-10 w-[85vw] max-w-sm h-full ml-auto rtl:ml-0 rtl:mr-auto bg-white shadow-2xl overflow-y-auto flex flex-col justify-between p-6 pt-4 transition-transform duration-300">
        <div>
          {/* Header row with Brand & Close Button */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 flex items-center shrink-0">
                <img
                  src={brandLogo}
                  alt={brandName}
                  className="h-9 w-auto max-w-[150px] object-contain rounded-lg"
                />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                  {brandBusinessName}
                </span>
                <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <Award className="w-3 h-3 text-amber-500" /> {t('common.licensedGuide')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer touch-manipulation"
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
                  onClick={() => handleNavClick(link.href)}
                  className={`flex items-center justify-between min-h-[46px] px-4 py-3 rounded-2xl text-sm font-extrabold transition-colors cursor-pointer touch-manipulation ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 shadow-xs ring-1 ring-sky-200/60'
                      : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
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
            onClick={() => handleNavClick('/book')}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 active:from-sky-700 active:to-blue-700 text-white font-extrabold text-sm shadow-md shadow-sky-600/25 active:scale-95 transition-all text-center cursor-pointer touch-manipulation"
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
            href={`tel:${brandPhone}`}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-sky-600" />
            <span>{t('finalCta.orCall')} {brandPhone}</span>
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
