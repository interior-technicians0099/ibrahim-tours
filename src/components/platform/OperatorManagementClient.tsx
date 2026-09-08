'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  Award,
  Save,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Phone,
  MessageCircle,
  Mail,
  ExternalLink,
  Calendar,
  Lock,
  PlusCircle,
  CreditCard,
  Banknote,
  FileText,
  Info,
} from 'lucide-react';
import PlatformNav from '@/components/platform/PlatformNav';

export interface OperatorDetails {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  whatsapp: string;
  email: string;
  yearsExperience: number;
  commissionRate: number | null;
  traLicenseNumber: string | null;
  traLicenseExpiry: string | null;
  traLicenseUrl: string | null;
  paymentInstructions: string;
  paymentNotes: string | null;
  mpesaNumber: string | null;
  bankName: string | null;
  bankAccount: string | null;
  toursCount: number;
  vehiclesCount: number;
  completedBookingsCount: number;
}

interface Props {
  operators: OperatorDetails[];
  globalRate: number | null;
}

export default function OperatorManagementClient({ operators, globalRate }: Props) {
  const [selectedOperator, setSelectedOperator] = useState<OperatorDetails>(operators[0] || null);

  // Form states
  const [commissionRate, setCommissionRate] = useState<string>(
    selectedOperator?.commissionRate !== null && selectedOperator?.commissionRate !== undefined
      ? selectedOperator.commissionRate.toString()
      : ''
  );
  const [traNumber, setTraNumber] = useState<string>(selectedOperator?.traLicenseNumber || '');
  const [traExpiry, setTraExpiry] = useState<string>(
    selectedOperator?.traLicenseExpiry ? selectedOperator.traLicenseExpiry.slice(0, 10) : ''
  );
  const [traUrl, setTraUrl] = useState<string>(selectedOperator?.traLicenseUrl || '');

  // Payment oversight form states
  const [mpesaNumber, setMpesaNumber] = useState<string>(selectedOperator?.mpesaNumber || '');
  const [bankName, setBankName] = useState<string>(selectedOperator?.bankName || '');
  const [bankAccount, setBankAccount] = useState<string>(selectedOperator?.bankAccount || '');
  const [paymentInstructions, setPaymentInstructions] = useState<string>(
    selectedOperator?.paymentInstructions || ''
  );
  const [paymentNotes, setPaymentNotes] = useState<string>(selectedOperator?.paymentNotes || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isLicenseExpired = traExpiry ? new Date(traExpiry) <= new Date() : false;
  const isLicenseActive = Boolean(traNumber && !isLicenseExpired);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) return;

    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await fetch(`/api/platform/operators/${selectedOperator.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionRate: commissionRate.trim() === '' ? null : parseFloat(commissionRate),
          traLicenseNumber: traNumber.trim() === '' ? null : traNumber.trim(),
          traLicenseExpiry: traExpiry ? new Date(traExpiry).toISOString() : null,
          traLicenseUrl: traUrl.trim() === '' ? null : traUrl.trim(),
          mpesaNumber: mpesaNumber.trim() === '' ? null : mpesaNumber.trim(),
          bankName: bankName.trim() === '' ? null : bankName.trim(),
          bankAccount: bankAccount.trim() === '' ? null : bankAccount.trim(),
          paymentInstructions: paymentInstructions.trim() || undefined,
          paymentNotes: paymentNotes.trim() === '' ? null : paymentNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSaveError(data.error || 'Failed to update operator.');
        setIsSaving(false);
        return;
      }

      setSaveSuccess('Operator configuration, TRA licensing, and payment instructions updated.');
      setSelectedOperator((prev) => ({
        ...prev,
        commissionRate: commissionRate.trim() === '' ? null : parseFloat(commissionRate),
        traLicenseNumber: traNumber.trim() === '' ? null : traNumber.trim(),
        traLicenseExpiry: traExpiry || null,
        traLicenseUrl: traUrl.trim() === '' ? null : traUrl.trim(),
        mpesaNumber: mpesaNumber.trim() === '' ? null : mpesaNumber.trim(),
        bankName: bankName.trim() === '' ? null : bankName.trim(),
        bankAccount: bankAccount.trim() === '' ? null : bankAccount.trim(),
        paymentInstructions: paymentInstructions.trim(),
        paymentNotes: paymentNotes.trim() === '' ? null : paymentNotes.trim(),
      }));
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: any) {
      setSaveError(err?.message || 'Network error updating operator.');
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
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <span>Operator & Trust Management</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                Governance
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Commercial profile, custom commission overrides, payment instructions oversight, and Zanzibar TRA compliance
            </p>
          </div>

          {/* Add Operator Disabled Button with Tooltip */}
          <div className="relative group">
            <button
              type="button"
              disabled
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 text-slate-400 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed border border-slate-700/60 opacity-70"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Add Operator</span>
            </button>
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-slate-800 text-[11px] text-slate-300 rounded-xl shadow-xl border border-slate-700 z-30 pointer-events-none text-center">
              Multi-operator onboarding is coming in v3.1. Ibrahim Tours is currently the exclusive lead operator.
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {saveError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {selectedOperator && (
          <div className="space-y-8">
            {/* Operator Commercial Overview Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-amber-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg">
                    IT
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">{selectedOperator.name}</h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Active Lead Operator
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{selectedOperator.businessName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Catalog</span>
                    <span className="text-sm font-black text-white">{selectedOperator.toursCount} Tours</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Fleet</span>
                    <span className="text-sm font-black text-white">{selectedOperator.vehiclesCount} Vehicles</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Delivered</span>
                    <span className="text-sm font-black text-emerald-400">
                      {selectedOperator.completedBookingsCount} Completed
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>{selectedOperator.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>{selectedOperator.whatsapp}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>{selectedOperator.email}</span>
                </div>
              </div>
            </div>

            {/* TRA Licensing & Commission & Payment Oversight Form */}
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Section 1: Zanzibar Revenue Authority (TRA) & Tourism Commission (ZCT) */}
              <div className="bg-slate-900/60 border border-emerald-900/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                        TRA & ZCT Commercial Tourism License
                      </h3>
                      <p className="text-xs text-slate-400">
                        When active and unexpired, an official verified trust badge is displayed on public pages
                      </p>
                    </div>
                  </div>

                  {isLicenseActive ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>License Active</span>
                    </span>
                  ) : isLicenseExpired ? (
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/40 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>License Expired</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30">
                      Unverified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      TRA / ZCT License Number
                    </label>
                    <input
                      type="text"
                      value={traNumber}
                      onChange={(e) => setTraNumber(e.target.value)}
                      placeholder="e.g. ZCT-OP-2026-0841"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      License Expiry Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="date"
                        value={traExpiry}
                        onChange={(e) => setTraExpiry(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Official Government Verification Document URL
                    </label>
                    <input
                      type="url"
                      value={traUrl}
                      onChange={(e) => setTraUrl(e.target.value)}
                      placeholder="https://zct.go.tz/verify/ZCT-OP-2026-0841"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Live Public Trust Badge Preview */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Public Trust Badge Live Preview
                  </span>
                  {isLicenseActive ? (
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Zanzibar Tourism Certified: {traNumber}</span>
                      {traUrl && (
                        <a
                          href={traUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-0.5 ml-1 text-emerald-200 text-[10px]"
                        >
                          <span>(Verify Doc)</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ) : isLicenseExpired ? (
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Badge Hidden: License Expired on {traExpiry}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Add a TRA license number and future expiry date above to activate the official verified trust badge across the website.
                    </p>
                  )}
                </div>
              </div>

              {/* Section 2: Operator Commission Override */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Commission Rate Override
                  </h3>
                  <p className="text-xs text-slate-400">
                    Set an operator-specific percentage. Leave empty to inherit the global platform rate (
                    {globalRate !== null ? `${globalRate}%` : 'TBD'}
                    ).
                  </p>
                </div>

                <div className="max-w-xs">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Commission Rate Percentage (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      placeholder={globalRate !== null ? `Inherit default (${globalRate}%)` : 'Leave empty for TBD'}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Tourist Payment Instructions Oversight */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-5 h-5 text-sky-400" />
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                        Guest Payment Instructions Oversight
                      </h3>
                      <p className="text-xs text-slate-400">
                        Review and ensure the M-Pesa & Bank details sent to guests after booking confirmation are correct
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Vodacom M-Pesa Number
                    </label>
                    <input
                      type="text"
                      value={mpesaNumber}
                      onChange={(e) => setMpesaNumber(e.target.value)}
                      placeholder="+255 777 123 456"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Bank Name & Branch
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. CRDB Bank Zanzibar"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Bank Account / IBAN / SWIFT Details
                    </label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Account No: 0150..., SWIFT: CORUTZTZ"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Payment Instructions (Shown on /book/confirmed & Confirmation Emails)
                    </label>
                    <textarea
                      rows={3}
                      value={paymentInstructions}
                      onChange={(e) => setPaymentInstructions(e.target.value)}
                      placeholder="Please pay directly in cash upon arrival, or via M-Pesa before excursion departure..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Internal Admin / Operator Payment Notes
                    </label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="e.g. Cash in USD preferred for marine park fees"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Operator Configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
