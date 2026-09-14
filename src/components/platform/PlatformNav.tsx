'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Scale,
  Receipt,
  Users,
  History,
  Settings,
  Shield,
  ArrowUpRight,
  Sparkles,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';
import UhakikiModal from '@/components/platform/UhakikiModal';

interface Props {
  adminName?: string;
  adminEmail?: string;
}

export default function PlatformNav({ adminName, adminEmail }: Props) {
  const pathname = usePathname();
  const [isUhakikiOpen, setIsUhakikiOpen] = useState(false);

  const navItems = [
    { label: 'Overview', href: '/platform', icon: LayoutDashboard, exact: true },
    { label: 'Bookings Master', href: '/platform/bookings', icon: BookOpen },
    { label: 'Receipts', href: '/platform/receipts', icon: FileCheck },
    { label: 'Reconciliation', href: '/platform/reconciliation', icon: Scale },
    { label: 'Settlements', href: '/platform/settlements', icon: Receipt },
    { label: 'Operators & Trust', href: '/platform/operators', icon: Users },
    { label: 'Audit Logs', href: '/platform/audit-logs', icon: History },
    { label: 'Branding & Logo', href: '/platform/branding', icon: Sparkles },
    { label: 'Settings', href: '/platform/settings', icon: Settings },
  ];

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-8 py-3.5 sticky top-0 z-30 backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 font-black text-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">
                  Zansafari Horizon Platform
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  SUPERADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400">System Management & Revenue Control Room</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LogoutButton />
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsUhakikiOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
            title="Verify 6-character tour check-in code"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Uhakiki (Verify)</span>
          </button>

          <div className="hidden md:block">
            <LogoutButton />
          </div>
        </div>
      </div>

      <UhakikiModal
        isOpen={isUhakikiOpen}
        onClose={() => setIsUhakikiOpen(false)}
      />
    </header>
  );
}
