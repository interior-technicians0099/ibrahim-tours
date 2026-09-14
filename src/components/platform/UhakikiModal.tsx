'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Users,
  Calendar,
  MapPin,
  FileText,
  Loader2,
  ExternalLink,
  Phone,
  Sparkles,
} from 'lucide-react';
import { getLanguageBadge } from '@/lib/language-utils';

interface UhakikiModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export default function UhakikiModal({ isOpen, onClose, initialCode = '' }: UhakikiModalProps) {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCode(initialCode);
      setResult(null);
      setError(null);
      setSuccessMessage(null);
      setTimeout(() => {
        inputRef.current?.focus();
        if (initialCode.trim()) {
          handleVerify(initialCode.trim());
        }
      }, 100);
    }
  }, [isOpen, initialCode]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleVerify = async (searchCode?: string) => {
    const targetCode = (searchCode !== undefined ? searchCode : code).trim();
    if (!targetCode) {
      setError('Please enter a 6-character code or receipt number.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/platform/receipts/verify?code=${encodeURIComponent(targetCode)}`);
      const data = await res.json();

      if (!res.ok || !data.isValid) {
        setError(data.reason || 'Verification code not found or invalid.');
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Network error verifying code.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!result?.receipt?.verificationCode) return;

    setCheckInLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/platform/receipts/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: result.receipt.verificationCode }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to complete check-in.');
      } else {
        setSuccessMessage(data.message || 'Check-in confirmed successfully!');
        setResult((prev: any) => ({
          ...prev,
          booking: {
            ...prev.booking,
            checkedInAt: data.checkedInAt,
            checkedInByName: data.checkedInByName,
          },
        }));
      }
    } catch (err: any) {
      setError(err?.message || 'Network error recording check-in.');
    } finally {
      setCheckInLoading(false);
    }
  };

  if (!isOpen) return null;

  const lang = result?.booking ? getLanguageBadge(result.booking.locale) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/70 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Uhakiki / Tour Verification</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Validate 6-character code or receipt # when guide contacts office on tour day
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-5 sm:p-6 bg-slate-900/90 border-b border-slate-800 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="flex items-center gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-char code (e.g. K9X2P7) or receipt #..."
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-base sm:text-lg font-mono tracking-widest text-white uppercase placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-950 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Verify</span>
            </button>
          </form>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Verification Result Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {result?.booking ? (
            <div className="space-y-6">
              {/* Top status banner */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  result.booking.checkedInAt
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        result.booking.checkedInAt
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {result.booking.checkedInAt ? '✓ Verified & Checked In' : '⏳ Valid — Ready for Check-In'}
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      Receipt: <strong className="text-white">{result.receipt.receiptNumber}</strong>
                    </span>
                  </div>

                  <div className="text-sm font-bold text-white flex items-center gap-2 pt-1">
                    <span>Code:</span>
                    <span className="text-xl font-mono tracking-widest text-emerald-400 bg-black/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      {result.receipt.verificationCode}
                    </span>
                    <span className="text-xs text-slate-400 font-normal">
                      (Ref: {result.booking.referenceCode})
                    </span>
                  </div>

                  {result.booking.checkedInAt && (
                    <p className="text-xs text-emerald-300">
                      Checked in on {new Date(result.booking.checkedInAt).toLocaleString('en-US')}
                      {result.booking.checkedInByName ? ` by ${result.booking.checkedInByName}` : ''}.
                    </p>
                  )}
                </div>

                {!result.booking.checkedInAt && (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkInLoading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    {checkInLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Mark Checked-In</span>
                  </button>
                )}
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Tourist info */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Tourist & Language
                  </span>
                  <div className="font-bold text-white text-sm">
                    {result.booking.customerName}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {lang && (
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 ${lang.color}`}>
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    )}
                    <span className="text-slate-400">
                      {result.booking.customerCountry || 'International'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 pt-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{result.booking.customerPhone}</span>
                  </div>
                </div>

                {/* Service info */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Service & Tour Date
                  </span>
                  <div className="font-bold text-white text-sm">
                    {result.booking.serviceTitle}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>{result.booking.tourDate} ({result.booking.bookingTime})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{result.booking.numAdults} Adults{result.booking.numChildren > 0 ? `, ${result.booking.numChildren} Children` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Guide Details */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Assigned Guide
                </span>
                {result.booking.guideName ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">
                        {result.booking.guideName}
                      </div>
                      <div className="text-slate-400 text-xs">
                        Phone: {result.booking.guidePhone || 'N/A'}
                      </div>
                    </div>
                    {result.booking.guidePhone && (
                      <a
                        href={`tel:${result.booking.guidePhone}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>Call Guide</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">
                    Offline guide assignment pending in network (Ibrahim contacted via Work Order).
                  </p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <a
                  href={`/receipt/${result.receipt.receiptNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-semibold transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Open Printable Receipt Voucher</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-sm">
                Enter a 6-character code (e.g. <span className="font-mono text-slate-400">K9X2P7</span>) or receipt number to inspect.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
