'use client';

import React, { useState } from 'react';
import { Wallet, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface MethodItem {
  id: string;
  code: string;
  enabled: boolean;
  label: string | null;
  details: Record<string, string>;
  sortOrder: number;
}

interface Props {
  initialMethods: MethodItem[];
}

const FIELD_HINTS: Record<string, Array<{ key: string; label: string; placeholder: string }>> = {
  MPESA: [{ key: 'number', label: 'M-Pesa number', placeholder: '+255 618 769 150' }],
  MIXX_BY_YAS: [{ key: 'number', label: 'Mixx by Yas number', placeholder: '+255 ...' }],
  AIRTEL_MONEY: [{ key: 'number', label: 'Airtel Money number', placeholder: '+255 ...' }],
  BANK: [
    { key: 'bankName', label: 'Bank name', placeholder: 'CRDB Bank Zanzibar' },
    { key: 'accountName', label: 'Account name', placeholder: 'Zansafari Horizon' },
    { key: 'accountNumber', label: 'Account number', placeholder: '0150...' },
  ],
  CASH: [{ key: 'note', label: 'Cash note shown to tourists', placeholder: 'Pay in USD at our Stone Town office' }],
};

export default function PlatformPaymentMethodsClient({ initialMethods }: Props) {
  const [methods, setMethods] = useState<MethodItem[]>(initialMethods);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const patch = (code: string, update: Partial<MethodItem>) =>
    setMethods((prev) => prev.map((m) => (m.code === code ? { ...m, ...update } : m)));

  const patchDetail = (code: string, key: string, value: string) =>
    setMethods((prev) =>
      prev.map((m) => (m.code === code ? { ...m, details: { ...m.details, [key]: value } } : m))
    );

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/platform/settings/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          methods: methods.map((m, i) => ({
            code: m.code,
            enabled: m.enabled,
            label: m.label,
            details: m.details,
            sortOrder: i,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save.');
      setMethods(data.methods);
      setMsg({ type: 'success', text: 'Payment methods saved. Tourist confirmation pages and emails now reflect these.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
            <Wallet className="w-3 h-3" />
            <span>Tourist checkout</span>
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Payment Methods</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Only <strong>enabled</strong> methods with details are shown on the booking confirmation page and in tourist emails.
        </p>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="space-y-4">
        {methods.map((m) => (
          <div key={m.code} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-mono font-black text-white tracking-wider">{m.code}</div>
                <div className="text-[11px] text-slate-500">Custom display label (optional — otherwise localized default)</div>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer shrink-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked={m.enabled}
                  onClick={() => patch(m.code, { enabled: !m.enabled })}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    m.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                      m.enabled ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
                <span>{m.enabled ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>

            <input
              type="text"
              value={m.label || ''}
              onChange={(e) => patch(m.code, { label: e.target.value })}
              placeholder="Display label override (optional)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(FIELD_HINTS[m.code] || []).map((f) => (
                <label key={f.key} className="block">
                  <span className="text-[11px] font-semibold text-slate-400">{f.label}</span>
                  <input
                    type="text"
                    value={m.details[f.key] || ''}
                    onChange={(e) => patchDetail(m.code, f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span>{saving ? 'Saving...' : 'Save payment methods'}</span>
      </button>
    </div>
  );
}
