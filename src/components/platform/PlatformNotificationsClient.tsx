'use client';

import React, { useMemo, useState } from 'react';
import {
  Bell,
  Search,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  MailWarning,
  Loader2,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  bookingId: string | null;
  recipient: string;
  channel: string;
  type: string;
  payload: Record<string, any> | null;
  status: string;
  errorMessage: string | null;
  providerId: string | null;
  sentAt: string | null;
  createdAt: string;
  booking: {
    id: string;
    referenceCode: string;
    customerName: string;
    customerEmail: string;
  } | null;
}

interface Props {
  initialNotifications: NotificationItem[];
  initialFailedCount: number;
}

export default function PlatformNotificationsClient({ initialNotifications, initialFailedCount }: Props) {
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);
  const [failedCount, setFailedCount] = useState(initialFailedCount);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [testTo, setTestTo] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (statusFilter !== 'ALL' && n.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [
          n.type,
          n.recipient,
          n.errorMessage || '',
          n.booking?.referenceCode || '',
          n.booking?.customerEmail || '',
          String((n.payload as any)?.to || ''),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, statusFilter, search]);

  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      const res = await fetch(`/api/platform/notifications/${id}/resend`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...n, status: 'SENT', errorMessage: null, providerId: data.providerId, sentAt: new Date().toISOString() }
              : n
          )
        );
        setFailedCount((c) => Math.max(0, c - 1));
      } else {
        alert(data.error || 'Resend failed.');
        // Refresh error message inline
        setItems((prev) =>
          prev.map((n) => (n.id === id ? { ...n, errorMessage: data.error || n.errorMessage } : n))
        );
      }
    } catch (err: any) {
      alert(err?.message || 'Resend request failed.');
    } finally {
      setResendingId(null);
    }
  };

  const handleTestEmail = async () => {
    if (!testTo.trim()) {
      setTestResult('Enter a recipient address first.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testTo.trim() }),
      });
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestResult(`Request failed: ${err?.message || err}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-black uppercase tracking-wider border border-sky-500/30 flex items-center gap-1">
              <Bell className="w-3 h-3" />
              <span>Email delivery log</span>
            </span>
            {failedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-black uppercase tracking-wider border border-red-500/30 flex items-center gap-1">
                <MailWarning className="w-3 h-3" />
                <span>{failedCount} failed</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Every booking email is logged here with SENT / FAILED status. Failed rows are retryable.
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All statuses</option>
            <option value="SENT">Sent only</option>
            <option value="FAILED">Failed only</option>
          </select>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ref, type, error..."
              className="bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Test-email diagnostic */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Send className="w-3.5 h-3.5 text-sky-400" />
          <span>Delivery test (super-admin)</span>
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="recipient@example.com"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={handleTestEmail}
            disabled={testing}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{testing ? 'Sending...' : 'Send test email'}</span>
          </button>
        </div>
        {testResult && (
          <pre className="text-[11px] font-mono bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-x-auto text-slate-300 whitespace-pre-wrap">
            {testResult}
          </pre>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="p-4">Created</th>
                <th className="p-4">Type</th>
                <th className="p-4">Booking</th>
                <th className="p-4">Recipient</th>
                <th className="p-4">Status</th>
                <th className="p-4">Error</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    No notifications match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((n) => {
                  const isFailed = n.status === 'FAILED';
                  const to = String((n.payload as any)?.to || n.booking?.customerEmail || n.recipient);
                  return (
                    <tr key={n.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-slate-400 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-4 font-mono text-slate-300">{n.type}</td>
                      <td className="p-4 font-mono font-bold text-slate-200">
                        {n.booking?.referenceCode || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="p-4">
                        <div className="text-slate-200 font-medium">{n.recipient}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[220px]" title={to}>
                          {to}
                        </div>
                      </td>
                      <td className="p-4">
                        {isFailed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                            <XCircle className="w-3 h-3" />
                            <span>Failed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Sent</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 max-w-[260px]">
                        {n.errorMessage ? (
                          <span className="text-[11px] text-red-300/90 break-words" title={n.errorMessage}>
                            {n.errorMessage.length > 120 ? n.errorMessage.slice(0, 120) + '…' : n.errorMessage}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {isFailed && (
                          <button
                            onClick={() => handleResend(n.id)}
                            disabled={resendingId === n.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-[11px] transition-all cursor-pointer"
                            title="Regenerate and re-send this email"
                          >
                            {resendingId === n.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            <span>{resendingId === n.id ? 'Sending...' : 'Resend'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
