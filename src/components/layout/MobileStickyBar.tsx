import React from 'react';
import Link from 'next/link';
import { CalendarCheck, MessageCircle, Phone } from 'lucide-react';
import { OPERATOR } from '@/lib/constants';
import { getWhatsAppLink } from '@/lib/utils';

export default function MobileStickyBar() {
  return (
    <aside
      aria-label="Mobile quick actions bar"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 py-2.5 px-3 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] md:hidden"
    >
      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
        {/* 1. Request Booking */}
        <Link
          href="/book"
          className="flex flex-col items-center justify-center min-h-[44px] py-1.5 px-2 rounded-2xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-extrabold text-[11px] shadow-sm shadow-sky-600/20 active:scale-95 transition-all text-center"
        >
          <CalendarCheck className="w-4 h-4 mb-0.5" />
          <span>Book Now</span>
        </Link>

        {/* 2. WhatsApp Direct */}
        <a
          href={getWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center min-h-[44px] py-1.5 px-2 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-extrabold text-[11px] shadow-sm shadow-emerald-500/20 active:scale-95 transition-all text-center"
          aria-label="WhatsApp with prefilled message"
        >
          <MessageCircle className="w-4 h-4 fill-current mb-0.5" />
          <span>WhatsApp</span>
        </a>

        {/* 3. Call Ibrahim Direct */}
        <a
          href={`tel:${OPERATOR.phone}`}
          className="flex flex-col items-center justify-center min-h-[44px] py-1.5 px-2 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-extrabold text-[11px] shadow-sm active:scale-95 transition-all text-center"
          aria-label={`Call guide Ibrahim at ${OPERATOR.phone}`}
        >
          <Phone className="w-4 h-4 text-sky-400 mb-0.5" />
          <span>Call Guide</span>
        </a>
      </div>
    </aside>
  );
}
