'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';

interface FaqItem {
  q: string;
  a: string;
}

const TOUR_SPECIFIC_FAQS: FaqItem[] = [
  {
    q: 'Are these tours private or shared with other groups?',
    a: 'All excursions arranged by Ibrahim are 100% private for you and your travel companions. You will have your own private vehicle, dedicated licensed guide, and private boat charter without being rushed by large tourist crowds.',
  },
  {
    q: 'What is included in the stated tour prices?',
    a: 'Every tour clearly lists its inclusions. Prices include all official conservation and marine park entrance tickets, boat transfers, private air-conditioned vehicle pickups from your hotel, professional guiding, and refreshments (soft drinks, fresh fruits, or full seafood lunch where noted).',
  },
  {
    q: 'How do I pay if there is no online checkout?',
    a: 'We never ask for credit card numbers online. You simply submit a booking request or message Ibrahim on WhatsApp to secure your dates. You pay in person on the day of the tour in US Dollars, Euros, British Pounds, Tanzanian Shillings, or via Vodacom M-Pesa.',
  },
  {
    q: 'What should I wear or pack for the excursions?',
    a: 'For ocean & sandbank trips (Safari Blue, Mnemba, Nakupenda): pack swimwear, beach towels, biodegradable sunscreen, and water shoes. For Stone Town & Spice Tours: modest clothing covering shoulders and knees is recommended out of respect for local Swahili cultural traditions.',
  },
  {
    q: 'Can I combine multiple tours or adjust the itinerary?',
    a: 'Absolutely! Ibrahim specializes in custom tailored itineraries. You can combine Jozani Forest with The Rock Restaurant and Spice Tours in a single day. Message Ibrahim directly on WhatsApp to customize your dream day.',
  },
];

export default function TourFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tour Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1.5">
            Everything you need to know about booking and experiencing private tours in Zanzibar.
          </p>
        </div>

        <div className="space-y-3">
          {TOUR_SPECIFIC_FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 text-slate-500 shadow-xs">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-sky-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 py-4 text-xs sm:text-sm text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom inquiry prompt */}
        <div className="mt-8 p-4 rounded-2xl bg-sky-50 border border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span className="text-xs text-sky-900 font-medium">
            Have a custom question about your dates or group size?
          </span>
          <a
            href={getWhatsAppLink(
              'Hello Ibrahim! I have a question about booking tours in Zanzibar.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-xs"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>Ask Ibrahim Directly</span>
          </a>
        </div>
      </div>
    </section>
  );
}
