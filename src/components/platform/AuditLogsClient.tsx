'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  Code,
  Download,
  ChevronDown,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import PlatformNav from '@/components/platform/PlatformNav';
import { exportToCsv } from '@/lib/export-csv';

export interface AuditLogItem {
  id: string;
  userId: string | null;
  userName: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  rawDate?: string;
}

interface Props {
  initialLogs: AuditLogItem[];
}

export default function AuditLogsClient({ initialLogs }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [actorFilter, setActorFilter] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Distinct entity types
  const entityTypes = useMemo(() => {
    const types = new Set(initialLogs.map((l) => l.entityType).filter(Boolean));
    return ['ALL', ...Array.from(types)];
  }, [initialLogs]);

  // Distinct actions
  const actionTypes = useMemo(() => {
    const actions = new Set(initialLogs.map((l) => l.action).filter(Boolean));
    return ['ALL', ...Array.from(actions)];
  }, [initialLogs]);

  // Distinct actors
  const actorNames = useMemo(() => {
    const actors = new Set(initialLogs.map((l) => l.userName).filter(Boolean));
    return ['ALL', ...Array.from(actors)];
  }, [initialLogs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.entityId && log.entityId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.ipAddress && log.ipAddress.includes(searchQuery));

      const matchesEntity = entityFilter === 'ALL' || log.entityType === entityFilter;
      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      const matchesActor = actorFilter === 'ALL' || log.userName === actorFilter;

      return matchesSearch && matchesEntity && matchesAction && matchesActor;
    });
  }, [initialLogs, searchQuery, entityFilter, actionFilter, actorFilter]);

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  // Export Audit Logs to CSV
  const handleExportCsv = () => {
    exportToCsv(
      `audit-logs-${new Date().toISOString().slice(0, 10)}`,
      filteredLogs,
      [
        { header: 'Timestamp', key: 'createdAt' },
        { header: 'Action', key: 'action' },
        { header: 'Entity Type', key: 'entityType' },
        { header: 'Entity ID', key: 'entityId', formatter: (val) => val || '—' },
        { header: 'Actor Name', key: 'userName' },
        { header: 'Actor Role', key: 'userRole', formatter: (val) => val || 'System' },
        { header: 'IP Address', key: 'ipAddress', formatter: (val) => val || '127.0.0.1' },
        {
          header: 'Details JSON',
          key: 'details',
          formatter: (val) => JSON.stringify(val || {}),
        },
      ]
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Unified Platform Navigation */}
      <PlatformNav />

      {/* Subheader Toolbar */}
      <div className="bg-slate-900/40 border-b border-slate-800/80 px-4 sm:px-8 py-4 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <span>Enterprise Audit Log Explorer</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                Immutable Ledger
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological security audit trail of all financial actions, status gates, pricing updates, and operator modifications
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              {filteredLogs.length} Events
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        
        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          {/* Action Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Action
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {actionTypes.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Entity Type
            </label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {entityTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Actor Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Actor
            </label>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {actorNames.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Freeform Search */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Search Text
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ID, IP, keyword..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4 text-right">Payload Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                      No audit log records match the current filter selection.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;

                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>{log.createdAt}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                                log.action.includes('PAYMENT')
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : log.action.includes('COMPLETE')
                                  ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                                  : log.action.includes('SETTLEMENT')
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                  : log.action.includes('UPDATE')
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-bold text-white">{log.entityType}</div>
                            {log.entityId && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                {log.entityId.slice(0, 16)}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-medium text-slate-200">{log.userName}</div>
                            {log.userRole && (
                              <span className="text-[10px] text-slate-500 block">{log.userRole}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {log.ipAddress || '127.0.0.1'}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => toggleExpand(log.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors border border-slate-700/50"
                            >
                              <Code className="w-3 h-3" />
                              <span>{isExpanded ? 'Hide Payload' : 'View Payload'}</span>
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded JSON Diff Inspector */}
                        {isExpanded && (
                          <tr className="bg-slate-950/80">
                            <td colSpan={6} className="p-4">
                              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                  <span>Event Payload & State Diffs</span>
                                  <span className="font-mono">Log ID: {log.id}</span>
                                </div>
                                <pre className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800 max-h-60">
                                  {JSON.stringify(log.details || {}, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
