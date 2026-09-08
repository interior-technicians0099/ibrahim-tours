'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  Building,
  Languages,
  CreditCard,
  Calendar,
} from 'lucide-react';
import MediaManager, { MediaItem } from '@/components/operator/MediaManager';

interface OperatorProfileData {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  whatsapp: string;
  email: string;
  biography: string;
  paymentInstructions: string;
  paymentNotes?: string | null;
  mpesaNumber?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  traLicenseNumber?: string | null;
  traLicenseExpiry?: string | null;
  traLicenseUrl?: string | null;
  profilePhotoUrl?: string | null;
  languages: string[];
}

interface Props {
  initialProfile: OperatorProfileData;
}

export default function OperatorProfileClient({ initialProfile }: Props) {
  const [name, setName] = useState(initialProfile.name || '');
  const [businessName, setBusinessName] = useState(initialProfile.businessName || '');
  const [phone, setPhone] = useState(initialProfile.phone || '');
  const [whatsapp, setWhatsapp] = useState(initialProfile.whatsapp || '');
  const [email, setEmail] = useState(initialProfile.email || '');
  const [biography, setBiography] = useState(initialProfile.biography || '');
  const [paymentInstructions, setPaymentInstructions] = useState(
    initialProfile.paymentInstructions || ''
  );
  const [paymentNotes, setPaymentNotes] = useState(initialProfile.paymentNotes || '');
  const [mpesaNumber, setMpesaNumber] = useState(initialProfile.mpesaNumber || '+255 700 000 000');
  const [bankName, setBankName] = useState(initialProfile.bankName || 'CRDB Bank Zanzibar');
  const [bankAccount, setBankAccount] = useState(initialProfile.bankAccount || '0150 0000 0000 0');
  const [traLicenseNumber, setTraLicenseNumber] = useState(initialProfile.traLicenseNumber || 'TRA-ZNZ-2024-8841');
  const [traLicenseExpiry, setTraLicenseExpiry] = useState(initialProfile.traLicenseExpiry || '');

  // Media States
  const [profilePhotos, setProfilePhotos] = useState<MediaItem[]>(
    initialProfile.profilePhotoUrl
      ? [{ id: 'profile_photo', url: initialProfile.profilePhotoUrl, isHero: true }]
      : []
  );

  const [traLicenseDocs, setTraLicenseDocs] = useState<MediaItem[]>(
    initialProfile.traLicenseUrl
      ? [{ id: 'tra_doc', url: initialProfile.traLicenseUrl, isHero: true }]
      : []
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await fetch('/api/operator/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          businessName,
          phone,
          whatsapp,
          email,
          biography,
          paymentInstructions,
          paymentNotes,
          mpesaNumber,
          bankName,
          bankAccount,
          traLicenseNumber,
          traLicenseExpiry: traLicenseExpiry || null,
          profilePhotoUrl: profilePhotos[0]?.url || null,
          traLicenseUrl: traLicenseDocs[0]?.url || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSaveError(data.error || 'Failed to save profile changes.');
        setIsSaving(false);
        return;
      }

      setSaveSuccess('Operator profile, media, and payment instructions saved successfully.');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setSaveError(err?.message || 'Network error while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/operator"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">Operator Profile & Verification</h1>
            <p className="text-xs text-slate-400">Bio, photo, TRA license doc, and payment accounts</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {saveError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Profile Photo & Identity */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Building className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                1. Operator Profile Photo & Business Identity
              </h2>
            </div>

            {/* Profile Photo Upload */}
            <div>
              <MediaManager
                items={profilePhotos}
                onChange={setProfilePhotos}
                entityType="OPERATOR_PROFILE"
                allowMultiple={false}
                label="Official Guide / Operator Portrait Photo"
                helperText="Appears on the homepage Trust Intro, About Us page, and mobile drawer."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Operator / Guide Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Business / Trading Name *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Biography / Guide Experience
                </label>
                <textarea
                  rows={3}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Confidential Payment Accounts & Instructions */}
          <div className="bg-slate-900/60 border border-emerald-900/40 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  2. Confidential Payment Accounts & Instructions
                </h2>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Shown Only on Confirmed Voucher
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  M-Pesa Business Number
                </label>
                <input
                  type="text"
                  value={mpesaNumber}
                  onChange={(e) => setMpesaNumber(e.target.value)}
                  placeholder="+255 700 000 000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="CRDB Bank Zanzibar"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="0150 0000 0000 0"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tourist Payment Instructions (M-Pesa, Bank Transfer, Card)
                </label>
                <textarea
                  rows={4}
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Internal Policy Notes (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Exchange rates based on Bank of Tanzania daily published rate"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 3. TRA License & Tourism Commission Compliance */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                3. Zanzibar Commission for Tourism (ZCT) & TRA License
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  TRA / ZCT License Registration Number
                </label>
                <input
                  type="text"
                  value={traLicenseNumber}
                  onChange={(e) => setTraLicenseNumber(e.target.value)}
                  placeholder="TRA-ZNZ-2024-8841"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  License Expiry Date
                </label>
                <input
                  type="date"
                  value={traLicenseExpiry}
                  onChange={(e) => setTraLicenseExpiry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* TRA License Document Upload */}
              <div className="sm:col-span-2 pt-2">
                <MediaManager
                  items={traLicenseDocs}
                  onChange={setTraLicenseDocs}
                  entityType="TRA_LICENSE"
                  allowMultiple={false}
                  label="Official TRA License Certificate (Scanned Photo / Document)"
                  helperText="Upload verified official certificate issued by the Zanzibar Commission for Tourism."
                />
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/operator"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
