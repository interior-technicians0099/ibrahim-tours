import React from 'react';
import {
  ShieldCheck,
  BadgePercent,
  CalendarCheck,
  Sparkles,
  HeartHandshake,
  Compass,
  CheckCircle,
} from 'lucide-react';
import { OPERATOR } from '@/lib/constants';

const TRUST_CARDS = [
  {
    icon: <Compass className="w-6 h-6 text-sky-600" />,
    title: '100% Native Local Guide',
    description:
      'Ibrahim was born and raised in Zanzibar with over 10 years of professional guiding experience. Discover authentic hidden spots big tour buses never reach.',
    badge: 'Native Islander',
  },
  {
    icon: <BadgePercent className="w-6 h-6 text-emerald-600" />,
    title: 'Transparent USD Pricing',
    description:
      'What you see is what you pay. All marine park fees, boat charters, entrance tickets, and driver fees are explicitly clarified with zero hidden charges.',
    badge: 'Zero Hidden Fees',
  },
  {
    icon: <CalendarCheck className="w-6 h-6 text-amber-600" />,
    title: 'No Online Prepayment',
    description:
      'Book with complete peace of mind. Simply submit your request or message on WhatsApp to lock in your dates, and pay safely in cash or M-Pesa on arrival.',
    badge: 'Pay on Arrival',
  },
  {
    icon: <Sparkles className="w-6 h-6 text-indigo-600" />,
    title: 'Private & Customized Tours',
    description:
      'Every tour and transfer is 100% private for you and your travel companions. Enjoy flexible departure times and customized stops at your own rhythm.',
    badge: '100% Private',
  },
];

export default function WhyChooseOperator() {
  return (
    <section className="py-20 bg-white border-t border-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
            The Ibrahim Tours Difference
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
            Why Book with Ibrahim?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Experience authentic Zanzibari warmth, seamless private logistics, and unmatched local expertise.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_CARDS.map((card, i) => (
            <div
              key={i}
              className="bg-slate-50 rounded-3xl p-7 border border-slate-200/80 hover:border-sky-300 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-200/60 text-slate-700">
                    {card.badge}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                  {card.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verified Standard</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
