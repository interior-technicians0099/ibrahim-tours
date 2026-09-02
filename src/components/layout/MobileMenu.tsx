'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarCheck,
  MessageCircle,
  Phone,
  X,
  Compass,
  ChevronRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { OPERATOR } from '@/lib/constants';
import { getWhatsAppLink } from '@/lib/utils';

interface NavLink {
  name: string;
  href: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links?: NavLink[];
}

const DEFAULT_LINKS: NavLink[] = [
  { name: 'Home', href: '/' },
  { name: 'Meet Ibrahim', href: '/about' },
  { name: 'Tours & Excursions', href: '/tours' },
  { name: 'Transportation', href: '/transportation' },
  { name: 'Guest Reviews', href: '/reviews' },
  { name: 'Frequently Asked Questions', href: '/faq' },
  { name: 'Contact Ibrahim', href: '/contact' },
];

export default function MobileMenu({
  isOpen,
  onClose,
  links = DEFAULT_LINKS,
}: MobileMenuProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden flex flex-col bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Slide-down Drawer Panel */}
      <div className="relative w-full max-h-[85vh] bg-white rounded-b-3xl shadow-2xl overflow-y-auto flex flex-col justify-between p-6 pt-4 border-b border-slate-200 animate-in slide-in-from-top-4 duration-300">
        <div>
          {/* Header row with Brand & Close Button */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-xs">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                  {OPERATOR.businessName}
                </span>
                <span className="text-[10px] text-sky-700 font-bold uppercase tracking-wider">
                  Menu Navigation
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
          <nav className="space-y-1" aria-label="Mobile Navigation">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
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
                    className={`w-4 h-4 ${
                      isActive ? 'text-sky-600' : 'text-slate-300'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
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
            <span>Request Booking</span>
          </Link>

          {/* WhatsApp Direct Chat Button */}
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-extrabold text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-center"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Chat on WhatsApp</span>
          </a>

          {/* Operator Direct Phone */}
          <a
            href={`tel:${OPERATOR.phone}`}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-sky-600" />
            <span>Direct Call: {OPERATOR.phone}</span>
          </a>

          {/* Trust strip */}
          <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Pay on Arrival
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              10+ Years Experience
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
