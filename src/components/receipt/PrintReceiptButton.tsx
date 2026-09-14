'use client';

import React from 'react';
import { Printer, Download } from 'lucide-react';

export default function PrintReceiptButton({ receiptNumber }: { receiptNumber: string }) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 no-print">
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
      >
        <Printer className="w-4 h-4" />
        <span>Print Receipt / Save as PDF</span>
      </button>
    </div>
  );
}
