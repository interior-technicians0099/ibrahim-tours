'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  MessageCircle,
  Menu,
  X,
  Phone,
  CalendarCheck,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { OPERATOR } from '@/lib/constants';
import { CompanyProfileData } from '@/lib/company';
import MobileMenu from './MobileMenu';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface HeaderProps {
  company?: CompanyProfileData;
}

export default function Header({ company }: HeaderProps) {
  const pathname = usePathname();
  const { t, getLocalizedWhatsAppLink } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide on admin/operator portals and login where portal headers are used
  if (
    pathname?.startsWith('/platform') ||
    pathname?.startsWith('/operator') ||
    pathname?.startsWith('/login')
  ) {
    return null;
  }

  const brandName = company?.companyName || company?.businessName || OPERATOR.name;
  const brandTagline = company?.tagline || OPERATOR.tagline;
  const brandLogo = company?.logoUrl || OPERATOR.logoUrl || '/branding/zansafari-logo.png';

  const navLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.tours'), href: '/tours' },
    { name: t('nav.transportation'), href: '/transportation' },
    { name: t('nav.reviews'), href: '/reviews' },
    { name: t('nav.faq'), href: '/faq' },
    { name: t('nav.contact'), href: '/contact' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm py-3 border-b border-slate-200/80'
            : 'bg-white py-4 border-b border-slate-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Brand Identity */}
            <Link
              href="/"
              className="flex items-center gap-2.5 min-w-0 flex-1 max-w-[calc(100%-105px)] lg:max-w-none group focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl"
              aria-label={`${brandName} - Home`}
            >
              <div className="h-9 sm:h-12 flex items-center justify-center shrink-0">
                <img
                  src={brandLogo}
                  alt={brandName}
                  className="h-8 sm:h-11 w-auto max-w-[110px] sm:max-w-[160px] object-contain rounded-lg"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-xs sm:text-base tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors leading-tight truncate">
                  {brandName}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-amber-700 uppercase tracking-wider truncate">
                  {brandTagline}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav
              className="hidden lg:flex items-center gap-1 xl:gap-2"
              aria-label="Main Navigation"
            >
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-sky-500 ${
                      isActive
                        ? 'text-sky-700 bg-sky-50 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Action CTAs + Global Language Selector */}
            <div className="hidden lg:flex items-center gap-2.5">
              {/* Desktop Language Selector */}
              <LanguageSelector variant="desktop" />

              {/* WhatsApp Direct Action */}
              <a
                href={getLocalizedWhatsAppLink('default')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 text-xs font-bold shadow-2xs transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                aria-label="Direct WhatsApp Chat with Zansafari Horizon"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 fill-current" />
                <span className="hidden md:inline">{t('nav.whatsAppUs')}</span>
              </a>

              {/* Book Now Primary Button */}
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 active:from-sky-800 active:to-blue-800 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>{t('nav.bookRequest')}</span>
              </Link>
            </div>

            {/* Mobile Actions: WhatsApp Icon + Hamburger Trigger */}
            <div className="flex lg:hidden items-center gap-2 shrink-0 z-30">
              <a
                href={getLocalizedWhatsAppLink('default')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 touch-manipulation cursor-pointer shrink-0"
                aria-label="Open WhatsApp Chat"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
              </a>

              <button
                type="button"
                id="mobile-menu-trigger"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer touch-manipulation shrink-0 relative z-30"
                aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Navigation Menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-in Mobile Menu Drawer */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={navLinks}
        company={company}
      />
    </>
  );
}
