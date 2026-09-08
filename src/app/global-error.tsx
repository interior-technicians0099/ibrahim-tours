'use client';

import React, { useEffect } from 'react';
import { Compass, RefreshCw, AlertCircle, MessageCircle } from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Unhandled Global Application Error caught by global-error.tsx', error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              Ibrahim Tours Zanzibar
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Something Went Wrong
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              We encountered an unexpected glitch. Our engineering monitoring team (Sentry) has been automatically notified.
            </p>
          </div>

          {error.digest && (
            <div className="p-2.5 rounded-xl bg-slate-800/80 text-[11px] font-mono text-slate-400 border border-slate-700/50">
              Error Reference: {error.digest}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-lg transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>

            <a
              href={getWhatsAppLink('Hello Ibrahim! I encountered an error on the website while browsing. Could you assist me?')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-lg transition-all active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
