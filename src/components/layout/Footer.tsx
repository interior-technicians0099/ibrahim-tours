import React from 'react';
import Link from 'next/link';
import {
  Compass,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Award,
  Globe2,
  CalendarCheck,
  ChevronRight,
  Heart,
} from 'lucide-react';
import { OPERATOR, FEATURED_PACKAGES } from '@/lib/constants';
import { getWhatsAppLink } from '@/lib/utils';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white pt-16 pb-28 md:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-800/80">
          {/* Column 1: Brand & Operator Story (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl w-fit"
              aria-label="Ibrahim Tours Zanzibar Homepage"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6 animate-[spin_16s_linear_infinite]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-white group-hover:text-sky-400 transition-colors leading-tight">
                  {OPERATOR.businessName}
                </span>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  Stone Town, Zanzibar
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Your premier licensed local tour operator in Zanzibar. Offering private, authentic island excursions, marine adventures, cultural walks, and reliable airport transfers with zero upfront prepayment.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Licensed Operator</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/60 border border-sky-800/50 text-sky-400 text-xs font-semibold">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>{OPERATOR.experience}</span>
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
              Explore
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link
                  href="/"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Meet Ibrahim
                </Link>
              </li>
              <li>
                <Link
                  href="/tours"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Tours & Excursions
                </Link>
              </li>
              <li>
                <Link
                  href="/transportation"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Airport Transfers
                </Link>
              </li>
              <li>
                <Link
                  href="/reviews"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Guest Reviews
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/book"
                  className="text-amber-400 hover:text-amber-300 font-bold transition-colors"
                >
                  Request Booking →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Featured Tours (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
              Top Experiences
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {FEATURED_PACKAGES.slice(0, 5).map((tour) => (
                <li key={tour.id}>
                  <Link
                    href={`/tours/${tour.slug}`}
                    className="text-slate-400 hover:text-white transition-colors flex items-center justify-between group"
                  >
                    <span className="truncate">{tour.title}</span>
                    <span className="text-[11px] text-slate-500 group-hover:text-amber-400 transition-colors shrink-0 ml-2">
                      {tour.duration}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Direct Dispatch (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
              Direct Contact
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{OPERATOR.location}</span>
              </li>

              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <a
                  href={`tel:${OPERATOR.phone}`}
                  className="hover:text-white transition-colors"
                >
                  {OPERATOR.phone}
                </a>
              </li>

              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <a
                  href={`mailto:${OPERATOR.email}`}
                  className="hover:text-white transition-colors break-all"
                >
                  {OPERATOR.email}
                </a>
              </li>

              <li className="flex items-center gap-2.5 text-slate-400 text-xs">
                <Globe2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>English, Swahili, Italian</span>
              </li>
            </ul>

            <div className="pt-2">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-extrabold text-xs shadow-md transition-all active:scale-95 text-center"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Guarantee */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <p>
            &copy; {new Date().getFullYear()} {OPERATOR.businessName}. All rights reserved.
          </p>

          <p className="flex items-center gap-1 text-slate-400">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>in Zanzibar, Tanzania</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
