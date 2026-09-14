'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  Sparkles,
  CreditCard,
  Calendar,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import MediaManager, { MediaItem } from '@/components/operator/MediaManager';

export interface BrandingData {
  id: string;
  companyName: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  officialPhone: string;
  officialEmail: string;
  officialWhatsapp: string;
  registrationNumber: string | null;
  traLicenseNumber: string | null;
  traLicenseExpiry: string | null;
  traLicenseUrl: string | null;
  mpesaNumber: string | null;
  bankName: string | null;
  bankAccount: string | null;
  paymentInstructions: string;
  paymentNotes: string | null;
  biography?: string | null;
  shortBio?: string | null;
}

interface Props {
  initialData: BrandingData;
}

export default function BrandingManagerClient({ initialData }: Props) {
  // Brand identity
  const [companyName, setCompanyName] = useState(initialData.companyName || 'Zansafari Horizon');
  const [tagline, setTagline] = useState(initialData.tagline || 'Spice • Culture • Wildlife');
  const [registrationNumber, setRegistrationNumber] = useState(
    initialData.registrationNumber || 'ZNZ-BR-2024-00892'
  );

  // Communications
  const [officialPhone, setOfficialPhone] = useState(initialData.officialPhone || '+255 618 769 150');
  const [officialWhatsapp, setOfficialWhatsapp] = useState(
    initialData.officialWhatsapp || '+255 618 769 150'
  );
  const [officialEmail, setOfficialEmail] = useState(
    initialData.officialEmail || 'info@zansafarihorizon.com'
  );

  // Licensing
  const [traLicenseNumber, setTraLicenseNumber] = useState(
    initialData.traLicenseNumber || 'TRA-ZNZ-2024-8841'
  );
  const [traLicenseExpiry, setTraLicenseExpiry] = useState(initialData.traLicenseExpiry || '');

  // Payment
  const [mpesaNumber, setMpesaNumber] = useState(
    initialData.mpesaNumber || '+255 618 769 150 (Zansafari Horizon)'
  );
  const [bankName, setBankName] = useState(initialData.bankName || 'CRDB Bank Zanzibar');
  const [bankAccount, setBankAccount] = useState(initialData.bankAccount || '0150 0000 0000 0');
  const [paymentInstructions, setPaymentInstructions] = useState(
    initialData.paymentInstructions ||
      'Your booking request has been reviewed and confirmed. To secure your reservation, please send the full payment to the M-Pesa number or Bank Account provided below. Your booking is confirmed only when full payment is received.'
  );
  const [paymentNotes, setPaymentNotes] = useState(initialData.paymentNotes || '');

  // Bio
  const [biography, setBiography] = useState(initialData.biography || '');
  const [shortBio, setShortBio] = useState(initialData.shortBio || '');

  // Media States
  const [logoMedia, setLogoMedia] = useState<MediaItem[]>(
    initialData.logoUrl ? [{ id: 'company_logo', url: initialData.logoUrl, isHero: true }] : []
  );

  const [traLicenseMedia, setTraLicenseMedia] = useState<MediaItem[]>(
    initialData.traLicenseUrl
      ? [{ id: 'tra_license_doc', url: initialData.traLicenseUrl, isHero: true }]
      : []
  );

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const activeLogoUrl = logoMedia[0]?.url || initialData.logoUrl || '/branding/zansafari-logo.png';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await fetch('/api/admin/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          tagline: tagline.trim(),
          logoUrl: logoMedia[0]?.url || initialData.logoUrl || '/branding/zansafari-logo.png',
          faviconUrl: logoMedia[0]?.url || initialData.faviconUrl || '/branding/favicon.png',
          officialPhone: officialPhone.trim(),
          officialEmail: officialEmail.trim(),
          officialWhatsapp: officialWhatsapp.trim(),
          registrationNumber: registrationNumber.trim(),
          traLicenseNumber: traLicenseNumber.trim(),
          traLicenseExpiry: traLicenseExpiry || null,
          traLicenseUrl: traLicenseMedia[0]?.url || null,
          mpesaNumber: mpesaNumber.trim(),
          bankName: bankName.trim(),
          bankAccount: bankAccount.trim(),
          paymentInstructions: paymentInstructions.trim(),
          paymentNotes: paymentNotes.trim() || null,
          biography: biography.trim() || null,
          shortBio: shortBio.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSaveError(data.error || 'Failed to save branding settings.');
        setIsSaving(false);
        return;
      }

      setSaveSuccess('Company branding saved successfully! Changes are live across the entire website.');
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      setSaveError(err?.message || 'Network error while saving branding.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Sticky Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-8 py-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/operator"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white">Company Branding & Settings</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  LIVE ISR SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage company name, logo, official contacts, licensing, and payment accounts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <span>View Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-95"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Branding</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Notifications */}
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 flex items-center gap-3 shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div className="text-xs sm:text-sm font-semibold">{saveSuccess}</div>
            </div>
          )}

          {saveError && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-300 flex items-center gap-3 shadow-lg animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <div className="text-xs sm:text-sm font-semibold">{saveError}</div>
            </div>
          )}

          {/* Section 1: Visual Identity & Logo */}
          <div className="bg-slate-900/60 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-base font-bold text-white">Visual Identity & Logo</h2>
                <p className="text-xs text-slate-400">
                  Logo rendered across website header, footer, booking vouchers, and Resend email templates.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Live Preview Card */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Current Live Logo
                </span>
                <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900 p-2 flex items-center justify-center shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeLogoUrl}
                    alt={companyName}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="mt-3 text-sm font-extrabold text-white">{companyName}</span>
                <span className="text-[11px] text-amber-300 font-semibold">{tagline}</span>
              </div>

              {/* Cloudinary MediaManager Upload */}
              <div className="md:col-span-8 space-y-3">
                <MediaManager
                  items={logoMedia}
                  onChange={(items) => setLogoMedia(items.slice(0, 1))}
                  entityType="GENERAL"
                  allowMultiple={false}
                  label="Upload New Logo via Cloudinary"
                  helperText="Upload official company logo (PNG, JPG, or WebP). Automatically replaces the site-wide logo."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Company Details & Registration */}
          <div className="bg-slate-900/60 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
              <Building className="w-5 h-5 text-sky-400" />
              <div>
                <h2 className="text-base font-bold text-white">Company Identity & Registration</h2>
                <p className="text-xs text-slate-400">Official registered corporate details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Zansafari Horizon"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Official Tagline *
                </label>
                <input
                  type="text"
                  required
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Spice • Culture • Wildlife"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Company Registration Number (BRELA / Zanzibar)
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. ZNZ-BR-2024-00892"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  TRA Tourism License Number
                </label>
                <input
                  type="text"
                  value={traLicenseNumber}
                  onChange={(e) => setTraLicenseNumber(e.target.value)}
                  placeholder="e.g. TRA-ZNZ-2024-8841"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  TRA License Expiry Date
                </label>
                <input
                  type="date"
                  value={traLicenseExpiry}
                  onChange={(e) => setTraLicenseExpiry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <MediaManager
                  items={traLicenseMedia}
                  onChange={(items) => setTraLicenseMedia(items.slice(0, 1))}
                  entityType="TRA_LICENSE"
                  allowMultiple={false}
                  label="TRA License Certificate Document / Image"
                  helperText="Upload official license document (PDF/Image) for regulatory verification."
                />
              </div>
            </div>
          </div>

          {/* Section 3: Official Company Communication Channels */}
          <div className="bg-slate-900/60 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
              <Phone className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-white">Official Communications</h2>
                <p className="text-xs text-slate-400">
                  Strictly official corporate channels for inquiries, WhatsApp dispatch, and emails.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Official Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={officialPhone}
                  onChange={(e) => setOfficialPhone(e.target.value)}
                  placeholder="e.g. +255 618 769 150"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Official WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={officialWhatsapp}
                  onChange={(e) => setOfficialWhatsapp(e.target.value)}
                  placeholder="e.g. +255 618 769 150"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  placeholder="e.g. info@zansafarihorizon.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Company Payment Details (Confidential) */}
          <div className="bg-slate-900/60 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-white">Company Payment Details</h2>
                <p className="text-xs text-slate-400">
                  Confidential payment credentials sent to tourists upon booking confirmation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Company M-Pesa Number / Till
                </label>
                <input
                  type="text"
                  value={mpesaNumber}
                  onChange={(e) => setMpesaNumber(e.target.value)}
                  placeholder="e.g. +255 618 769 150 (Zansafari Horizon)"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Company Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. CRDB Bank Zanzibar"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Company Bank Account Number
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g. 0150 0000 0000 0"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confidential Payment Instructions (Private to Tourist Vouchers)
                </label>
                <textarea
                  rows={3}
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  placeholder="Instructions explaining how to complete M-Pesa or bank transfer..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Company Story & About Page Text */}
          <div className="bg-slate-900/60 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
              <FileCheck className="w-5 h-5 text-sky-400" />
              <div>
                <h2 className="text-base font-bold text-white">Company Story & Biography</h2>
                <p className="text-xs text-slate-400">Story copy rendered on the /about page.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Company Story (Full Biography)
                </label>
                <textarea
                  rows={5}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Tell the story of Zansafari Horizon..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Short Teaser (1-2 sentences)
                </label>
                <input
                  type="text"
                  value={shortBio}
                  onChange={(e) => setShortBio(e.target.value)}
                  placeholder="Brief 1-sentence teaser..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Save Button (Bottom) */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving & Revalidating Site...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
