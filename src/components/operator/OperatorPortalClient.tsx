'use client';

import React, { useState } from 'react';
import {
  Inbox,
  BookOpen,
  CheckCircle2,
  Phone,
  MessageCircle,
  Loader2,
  Calendar,
  Users,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';
import type { OperatorBookingDTO } from '@/lib/serialization';

interface InboxMessage {
  id: string;
  bookingId: string;
  message: string;
  sentAt: string;
  readAt: string | null;
  sentBy?: { name: string | null; email: string | null } | null;
  booking: {
    id: string;
    referenceCode: string;
    serviceType: string;
    bookingDate: string;
    bookingTime: string | null;
    status: string;
    customerName: string;
  } | null;
}

interface Props {
  operatorName: string;
  initialMessages: InboxMessage[];
  initialBookings: OperatorBookingDTO[];
}

export default function OperatorPortalClient({ operatorName, initialMessages, initialBookings }: Props) {
  const [tab, setTab] = useState<'inbox' | 'bookings'>('inbox');
  const [messages, setMessages] = useState<InboxMessage[]>(initialMessages);
  const [bookings, setBookings] = useState<OperatorBookingDTO[]>(initialBookings);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const unreadCount = messages.filter((m) => !m.readAt).length;

  const markRead = async (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, readAt: m.readAt || new Date().toISOString() } : m)));
    try {
      await fetch(`/api/operator/inbox/${id}/read`, { method: 'POST' });
    } catch {
      // badges reconcile on next load; non-critical
    }
  };

  const handleComplete = async (bookingId: string) => {
    setCompletingId(bookingId);
    try {
      const res = await fetch(`/api/operator/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to mark completed.');
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? data.booking : b)));
      setConfirmId(null);
      alert(data.message || 'Tour marked as COMPLETED. Super admin notified.');
    } catch (err: any) {
      alert(err?.message || 'Failed to mark completed.');
    } finally {
      setCompletingId(null);
    }
  };

  const touristWhatsApp = (phone: string, ref: string) => {
    const clean = (phone || '').replace(/[^0-9]/g, '');
    return `https://wa.me/${clean}?text=${encodeURIComponent(`Hello! This is your Zansafari Horizon guide regarding tour ${ref}.`)}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Slim portal header */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-8 py-3.5 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">Operator Portal</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Operator
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Karibu, {operatorName} — assignments & tour completion</p>
          </div>
          <LogoutButton />
        </div>

        <nav className="flex items-center gap-1 mt-3 text-xs">
          <button
            onClick={() => setTab('inbox')}
            className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer ${
              tab === 'inbox' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Inbox</span>
            {unreadCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('bookings')}
            className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer ${
              tab === 'bookings' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tours ({bookings.length})</span>
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {tab === 'inbox' ? (
          messages.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
              <Inbox className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-white">No assignments yet</p>
              <p className="text-xs text-slate-400 mt-1">New tours from super admin will appear here.</p>
            </div>
          ) : (
            messages.map((m) => (
              <article
                key={m.id}
                className={`p-4 rounded-2xl border transition-all ${
                  m.readAt ? 'bg-slate-900 border-slate-800' : 'bg-sky-950/30 border-sky-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    <span className="font-mono font-bold text-sky-300">{m.booking?.referenceCode || '—'}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(m.sentAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {!m.readAt && (
                    <button
                      onClick={() => markRead(m.id)}
                      className="text-[11px] font-bold text-sky-300 hover:text-sky-200 underline shrink-0 cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-mono">{m.message}</p>
              </article>
            ))
          )
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-white">No forwarded tours</p>
            <p className="text-xs text-slate-400 mt-1">Tours super admin sends you will appear here.</p>
          </div>
        ) : (
          bookings.map((b) => (
            <article key={b.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono font-black text-white">{b.referenceCode}</div>
                  <div className="text-sm font-bold text-sky-300 mt-0.5">{b.serviceTitle}</div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                    b.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {b.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>
                    {new Date(b.bookingDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    {b.bookingTime ? ` • ${b.bookingTime}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {b.numAdults} adult{b.numAdults === 1 ? '' : 's'}
                    {b.numChildren > 0 ? ` + ${b.numChildren} child${b.numChildren === 1 ? '' : 'ren'}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Pickup: {b.pickupLocation || 'To be confirmed'}</span>
                </div>
                <div className="text-slate-300">
                  <span className="font-bold text-white">{b.customerName}</span>
                  {b.customerCountry ? <span className="text-slate-400"> ({b.customerCountry})</span> : null}
                  {b.preferredLanguage ? <span className="text-slate-400"> • {b.preferredLanguage}</span> : null}
                </div>
              </div>

              {b.specialRequests && (
                <p className="text-[11px] text-slate-400 bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
                  <strong className="text-slate-300">Requests: </strong>
                  {b.specialRequests}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={touristWhatsApp(b.customerPhone, b.referenceCode)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25d366] text-white text-[11px] font-bold"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp tourist</span>
                </a>
                <a
                  href={`tel:+${(b.customerPhone || '').replace(/[^0-9]/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {b.customerPhone}</span>
                </a>

                {b.status === 'CONFIRMED' && (
                  <button
                    onClick={() => setConfirmId(b.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors cursor-pointer ml-auto"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark COMPLETED</span>
                  </button>
                )}
              </div>

              {confirmId === b.id && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                  <p className="text-xs text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Confirm that tour <strong className="font-mono">{b.referenceCode}</strong> for{' '}
                      <strong>{b.customerName}</strong> is finished? Super admin will be notified and revenue finalized.
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleComplete(b.id)}
                      disabled={completingId === b.id}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {completingId === b.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{completingId === b.id ? 'Confirming...' : 'Yes, tour is done'}</span>
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </main>
    </div>
  );
}
