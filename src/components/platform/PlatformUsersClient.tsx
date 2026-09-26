'use client';

import React, { useState } from 'react';
import { Users, UserPlus, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Truck } from 'lucide-react';

interface PortalUser {
  id: string;
  email: string;
  name: string;
  role: string;
  operatorId: string | null;
  operator?: { companyName: string } | null;
  operatorName?: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface Props {
  currentUserId: string;
  initialUsers: PortalUser[];
  operators: Array<{ id: string; companyName: string }>;
}

export default function PlatformUsersClient({ currentUserId, initialUsers, operators }: Props) {
  const [users, setUsers] = useState<PortalUser[]>(initialUsers);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'OPERATOR', operatorId: '', tempPassword: '' });
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastTempPassword, setLastTempPassword] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMsg(null);
    setLastTempPassword(null);
    try {
      const res = await fetch('/api/platform/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          name: form.name.trim(),
          role: form.role,
          operatorId: form.role === 'OPERATOR' && form.operatorId ? form.operatorId : null,
          tempPassword: form.tempPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create user.');
      setUsers((prev) => [...prev, data.user]);
      setForm({ email: '', name: '', role: 'OPERATOR', operatorId: '', tempPassword: '' });
      setShowCreate(false);
      if (data.tempPassword) setLastTempPassword(data.tempPassword);
      setMsg({ type: 'success', text: data.message });
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Failed to create user.' });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (u: PortalUser) => {
    setTogglingId(u.id);
    try {
      const res = await fetch(`/api/platform/admin-users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update user.');
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: !u.isActive } : x)));
    } catch (err: any) {
      alert(err?.message || 'Failed to update user.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Two roles only</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Portal Users</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Provision PLATFORM_ADMIN (full control room) and OPERATOR (inbox + tours only) accounts.
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>New account</span>
        </button>
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

      {lastTempPassword && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
          <strong>One-time temporary password (share it securely, it will not be shown again):</strong>
          <div className="mt-1 font-mono text-base font-black text-amber-300">{lastTempPassword}</div>
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-400">Full name</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Amina Juma"
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-400">Email (login)</span>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="operator@example.com"
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-slate-400">Role</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500">
              <option value="OPERATOR">OPERATOR — inbox + tours only</option>
              <option value="PLATFORM_ADMIN">PLATFORM_ADMIN — full control room</option>
            </select>
          </label>
          {form.role === 'OPERATOR' ? (
            <label className="block">
              <span className="text-[11px] font-semibold text-slate-400">Operator company (scope)</span>
              <select value={form.operatorId} onChange={(e) => setForm({ ...form, operatorId: e.target.value })}
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500">
                <option value="">— Select company —</option>
                {operators.map((o) => (
                  <option key={o.id} value={o.id}>{o.companyName}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block">
              <span className="text-[11px] font-semibold text-slate-400">Temporary password (optional — auto-generated if blank)</span>
              <input value={form.tempPassword} onChange={(e) => setForm({ ...form, tempPassword: e.target.value })} placeholder="min. 8 characters"
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
            </label>
          )}
          <div className="sm:col-span-2">
            <button disabled={creating}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer">
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{creating ? 'Creating...' : 'Create account'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last login</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30">
                  <td className="p-4">
                    <div className="font-bold text-white">{u.name}</div>
                    <div className="text-[11px] text-slate-500">{u.email}</div>
                    {u.operator?.companyName || u.operatorName ? (
                      <div className="text-[11px] text-slate-500">↳ {u.operator?.companyName || u.operatorName}</div>
                    ) : null}
                    {u.mustChangePassword && (
                      <div className="text-[10px] text-amber-300 mt-0.5">Must change password</div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      u.role === 'PLATFORM_ADMIN'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    }`}>
                      {u.role === 'PLATFORM_ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                      <span>{u.role}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-bold ${u.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="p-4 text-right">
                    {u.id !== currentUserId && (
                      <button
                        onClick={() => handleToggle(u)}
                        disabled={togglingId === u.id}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                          u.isActive ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30' : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
                        }`}
                      >
                        {togglingId === u.id ? '...' : u.isActive ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
