'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Bell,
  Mail,
  Percent,
  Sliders,
  Shield,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

import PlatformNav from '@/components/platform/PlatformNav';
import { UserCheck } from 'lucide-react';

interface Props {
  initialRate: number | null;
  adminEmail: string;
  initialLeadGuide?: {
    leadGuideName: string;
    leadGuidePhone: string;
    leadGuideWhatsApp: string;
    leadGuideEmail: string;
  };
}

export default function PlatformSettingsClient({ initialRate, adminEmail, initialLeadGuide }: Props) {
  const [rate, setRate] = useState<string>(initialRate !== null ? initialRate.toString() : '');
  const [notificationEmail, setNotificationEmail] = useState<string>(
    adminEmail || 'admin@zansafarihorizon.com'
  );
  const [alertConfirmed, setAlertConfirmed] = useState<boolean>(true);
  const [alertReconciliation, setAlertReconciliation] = useState<boolean>(true);

  // Lead Guide Operations (Ibrahim) State
  const [leadGuideName, setLeadGuideName] = useState(initialLeadGuide?.leadGuideName || 'Ibrahim');
  const [leadGuidePhone, setLeadGuidePhone] = useState(initialLeadGuide?.leadGuidePhone || '+255 618 769 150');
  const [leadGuideWhatsApp, setLeadGuideWhatsApp] = useState(initialLeadGuide?.leadGuideWhatsApp || '+255 618 769 150');
  const [leadGuideEmail, setLeadGuideEmail] = useState(initialLeadGuide?.leadGuideEmail || 'info@zansafarihorizon.com');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // 1. Save Commission Rate
      const resComm = await fetch('/api/platform/settings/commission', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rate: rate.trim() === '' ? null : parseFloat(rate),
          description: 'Global standard platform commission percentage on tour profits.',
        }),
      });

      const dataComm = await resComm.json();
      if (!resComm.ok || !dataComm.success) {
        throw new Error(dataComm.error || 'Failed to save commission settings.');
      }

      // 2. Save Lead Guide Settings
      const resGuide = await fetch('/api/platform/settings/lead-guide', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadGuideName,
          leadGuidePhone,
          leadGuideWhatsApp,
          leadGuideEmail,
        }),
      });

      const dataGuide = await resGuide.json();
      if (!resGuide.ok || !dataGuide.success) {
        throw new Error(dataGuide.error || 'Failed to save lead guide settings.');
      }

      setSuccessMsg('Platform settings, commission rates, and Ibrahim contact details saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Unified Platform Navigation */}
      <PlatformNav />

      {/* Subheader Toolbar */}
      <div className="bg-slate-900/40 border-b border-slate-800/80 px-4 sm:px-8 py-4 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <span>Platform Settings & Policies</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold">
              Configuration
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Global commission rates, administrative notifications & financial settlement rules
          </p>
        </div>
      </div>

      {/* Main Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Access Card for Branding & Logo */}
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-indigo-500/10 border border-amber-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Company Branding & Website Logo</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Identity
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Upload new website logo, change brand name, tagline, official contacts, and TRA license credentials.
              </p>
            </div>
          </div>
          <Link
            href="/operator/branding"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0 active:scale-95"
          >
            <span>Manage Branding & Logo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Global Commission Rate */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <Percent className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Platform Commission Rate (Settings.commission_rate)
                </h3>
                <p className="text-xs text-slate-400">
                  Applied to net profit (Revenue − Costs) across completed excursions and private transfers
                </p>
              </div>
            </div>

            <div className="max-w-md space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Default Commission Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="e.g. 15 (or leave blank for Pending Rate / TBD)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <span className="absolute right-4 top-3 text-sm font-bold text-slate-400">%</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Leave empty or null to keep commission marked as <em>&quot;pending rate&quot;</em> until officially finalized with the operator.
              </p>

              {/* Recalculate Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('Recalculate platform commissions for all unsettled bookings with current rate?')) return;
                    setIsSaving(true);
                    try {
                      const res = await fetch('/api/platform/commission/recalculate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rate: rate.trim() === '' ? null : parseFloat(rate) }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.success) {
                        setErrorMsg(data.error || data.message || 'Recalculation failed.');
                      } else {
                        setSuccessMsg(data.message || `Recalculated ${data.recalculatedCount} bookings successfully.`);
                        setTimeout(() => setSuccessMsg(null), 4000);
                      }
                    } catch (err: any) {
                      setErrorMsg(err?.message || 'Error recalculating commissions.');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all flex items-center gap-2"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Recalculate Unsettled Bookings</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Administrative Notification Preferences */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <Bell className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Notification Routing Preferences
                </h3>
                <p className="text-xs text-slate-400">
                  Where transactional confirmation and settlement alerts are dispatched
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="max-w-md">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Platform Admin Alert Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertConfirmed}
                    onChange={(e) => setAlertConfirmed(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded bg-slate-950 border-slate-700 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    Send platform alert when a booking is fully paid and confirmed
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertReconciliation}
                    onChange={(e) => setAlertReconciliation(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded bg-slate-950 border-slate-700 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    Highlight reconciliation discrepancy warnings on the platform dashboard
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* 3. Lead Guide Operations (Ibrahim Contact Settings) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Lead Guide Operations (Ibrahim)
                </h3>
                <p className="text-xs text-slate-400">
                  Contact credentials used by Platform Admins to forward booking leads and dispatch official work orders
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300 leading-relaxed">
              <strong>Operating Model:</strong> Ibrahim has no system dashboard in V1. He receives prefilled WhatsApp leads and work orders, and sources professional guides offline from his Zanzibar network based on the tourist&apos;s language.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lead Guide Full Name
                </label>
                <input
                  type="text"
                  value={leadGuideName}
                  onChange={(e) => setLeadGuideName(e.target.value)}
                  required
                  placeholder="e.g. Ibrahim"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Official Phone Number
                </label>
                <input
                  type="text"
                  value={leadGuidePhone}
                  onChange={(e) => setLeadGuidePhone(e.target.value)}
                  required
                  placeholder="e.g. +255 618 769 150"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Direct WhatsApp Number (International format)
                </label>
                <input
                  type="text"
                  value={leadGuideWhatsApp}
                  onChange={(e) => setLeadGuideWhatsApp(e.target.value)}
                  required
                  placeholder="e.g. +255 618 769 150"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Official Operations Email
                </label>
                <input
                  type="email"
                  value={leadGuideEmail}
                  onChange={(e) => setLeadGuideEmail(e.target.value)}
                  required
                  placeholder="e.g. info@zansafarihorizon.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Platform Settings'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
