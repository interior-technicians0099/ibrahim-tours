'use client';

import React, { useEffect } from 'react';
import { RefreshCw, AlertCircle, MessageCircle, Home } from 'lucide-react';
import Link from 'next/link';
import { getWhatsAppLink } from '@/lib/utils';
import { logger } from '@/lib/logger';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Route-level error captured by app/error.tsx', error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
            Ibrahim Tours Zanzibar
          </span>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Page Unavailable
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            We were unable to load this specific section. Please refresh or return to the homepage.
          </p>
        </div>

        {error.digest && (
          <div className="p-2 rounded-xl bg-slate-50 text-[11px] font-mono text-slate-500 border border-slate-200">
            Code: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload View</span>
          </button>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
