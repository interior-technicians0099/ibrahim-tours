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
import { getWhatsAppLink } from '@/lib/utils';
import MobileMenu from './MobileMenu';

const NAV_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'Meet Ibrahim', href: '/about' },
  { name: 'Tours', href: '/tours' },
  { name: 'Transportation', href: '/transportation' },
  { name: 'Reviews', href: '/reviews' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Contact', href: '/contact' },
];

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
              className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl"
              aria-label="Ibrahim Tours Zanzibar - Home"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-200">
                <Compass className="w-6 h-6 animate-[spin_12s_linear_infinite]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors leading-tight">
                  {OPERATOR.name}
                </span>
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">
                  Zanzibar Tours & Transfers
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav
              className="hidden lg:flex items-center gap-1 xl:gap-2"
              aria-label="Main Navigation"
            >
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.name}
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

            {/* Desktop Action CTAs */}
            <div className="hidden sm:flex items-center gap-3">
              {/* WhatsApp Direct Action */}
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 text-xs font-bold shadow-2xs transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Direct WhatsApp Chat with Ibrahim"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 fill-current" />
                <span className="hidden md:inline">WhatsApp Us</span>
              </a>

              {/* Book Now Primary Button */}
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 active:from-sky-800 active:to-blue-800 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Book Request</span>
              </Link>
            </div>

            {/* Mobile Actions: WhatsApp Icon + Hamburger Trigger */}
            <div className="flex sm:hidden items-center gap-2">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs transition-transform active:scale-95"
                aria-label="Open WhatsApp Chat"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
              </a>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center hover:bg-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500"
                aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Navigation Menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-down Mobile Menu Drawer */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={NAV_LINKS}
      />
    </>
  );
}
