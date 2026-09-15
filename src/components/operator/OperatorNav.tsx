'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Calendar,
  Car,
  Star,
  Layers,
  HelpCircle,
  Sparkles,
  User,
  Receipt,
  ExternalLink,
  ShieldCheck,
  Building,
  Lock,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';

export interface OperatorNavProps {
  userRole?: string;
  userEmail?: string;
  operatorName?: string;
  pendingBookingsCount?: number;
  hideTabs?: boolean;
}

export default function OperatorNav({
  userRole = 'OPERATOR',
  userEmail = 'operator@zansafarihorizon.com',
  operatorName = 'Zansafari Horizon',
  pendingBookingsCount = 0,
  hideTabs = false,
}: OperatorNavProps) {
  const pathname = usePathname() || '/operator';

  const isCompanyAdmin = userRole === 'COMPANY_ADMIN';
  const isPlatformAdmin = userRole === 'PLATFORM_ADMIN';
  const isFieldOperator = userRole === 'OPERATOR';

  // Role visual configuration
  const roleConfig = isPlatformAdmin
    ? {
        title: 'Platform SuperAdmin',
        badge: '👑 PLATFORM ADMIN',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10',
        subtitle: 'SaaS Platform Oversight & All Operators',
        colorAccent: 'amber',
      }
    : isCompanyAdmin
    ? {
        title: 'Company Executive Portal',
        badge: '🏢 COMPANY ADMIN (MENEJA)',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10',
        subtitle: 'Usimamizi wa Fedha, Benki, Settlements & Biashara',
        colorAccent: 'emerald',
      }
    : {
        title: 'Field Operations & Dispatch',
        badge: '🚙 OPERATOR (UGANI & DISPATCH)',
        badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sky-500/10',
        subtitle: 'Usimamizi wa Watalii wa Leo, Safari, Magari & Mapokezi',
        colorAccent: 'sky',
      };

  // Nav Items definition
  const navItems = [
    {
      label: 'Bookings & Ledger',
      href: '/operator',
      exact: true,
      icon: Calendar,
      badge: pendingBookingsCount > 0 ? pendingBookingsCount : undefined,
      restricted: false,
    },
    {
      label: 'Manage Tours',
      href: '/operator/tours',
      icon: Compass,
      restricted: false,
    },
    {
      label: 'Transfers & Fleet',
      href: '/operator/transport',
      icon: Car,
      restricted: false,
    },
    {
      label: 'Reviews',
      href: '/operator/reviews',
      icon: Star,
      restricted: false,
    },
    {
      label: 'Categories',
      href: '/operator/categories',
      icon: Layers,
      restricted: false,
    },
    {
      label: 'FAQs',
      href: '/operator/faqs',
      icon: HelpCircle,
      restricted: false,
    },
    {
      label: 'Branding & Logo',
      href: '/operator/branding',
      icon: Sparkles,
      restricted: !isCompanyAdmin && !isPlatformAdmin,
      restrictedLabel: 'Meneja Tu',
    },
    {
      label: 'Bank & Profile',
      href: '/operator/profile',
      icon: User,
      restricted: !isCompanyAdmin && !isPlatformAdmin,
      restrictedLabel: 'Meneja Tu',
    },
    {
      label: 'Settlements & Statements',
      href: '/operator/settlements',
      icon: Receipt,
      restricted: !isCompanyAdmin && !isPlatformAdmin,
      restrictedLabel: 'Meneja Tu',
    },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-2xl backdrop-blur-md bg-slate-900/95">
      {/* 1. Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Branding & Role Badge */}
        <div className="flex items-center gap-3">
          {isPlatformAdmin ? (
            <Link
              href="/platform"
              className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Rudi kwenye Platform Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Platform</span>
            </Link>
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isCompanyAdmin
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
            }`}>
              {isCompanyAdmin ? <Building className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                {operatorName}
              </span>
              <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full border shadow-sm ${roleConfig.badgeClass}`}>
                {roleConfig.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {roleConfig.subtitle}
            </p>
          </div>
        </div>

        {/* Right: User Email, Live Site & Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-200">{userEmail}</span>
            <span className="text-[10px] text-slate-400">
              {isCompanyAdmin ? 'Meneja wa Kampuni' : isFieldOperator ? 'Afisa wa Ugani' : 'SuperAdmin'}
            </span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5"
            title="Tazama tovuti ya watalii (Live Site)"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <LogoutButton
            showText
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          />
        </div>
      </div>

      {/* 2. Horizontal Scrollable Navigation Tabs */}
      {!hideTabs && (
        <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 sm:px-6 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 py-2">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
                    isActive
                      ? isCompanyAdmin
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? (isCompanyAdmin ? 'text-emerald-400' : 'text-sky-400') : 'text-slate-400'}`} />
                  <span>{item.label}</span>

                  {/* Booking count pill */}
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 bg-sky-500 text-slate-950 rounded-full text-[10px] font-black">
                      {item.badge}
                    </span>
                  )}

                  {/* Lock label for restricted tabs */}
                  {item.restricted && (
                    <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      <span>{item.restrictedLabel}</span>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
