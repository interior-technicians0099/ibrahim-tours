'use client';

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
  Heart,
  Lock,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { OPERATOR, FEATURED_PACKAGES } from '@/lib/constants';
import { CompanyProfileData } from '@/lib/company';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface FooterProps {
  company?: CompanyProfileData;
}

export default function Footer({ company }: FooterProps) {
  const pathname = usePathname();
  const { t, getLocalizedWhatsAppLink } = useLanguage();

  // Hide on admin/operator portals and login where portal layouts are used
  if (
    pathname?.startsWith('/platform') ||
    pathname?.startsWith('/operator') ||
    pathname?.startsWith('/login')
  ) {
    return null;
  }

  const brandName = company?.companyName || company?.businessName || OPERATOR.name;
  const brandBusinessName = company?.businessName || company?.companyName || OPERATOR.businessName;
  const brandTagline = company?.tagline || OPERATOR.tagline;
  const brandLogo = company?.logoUrl || OPERATOR.logoUrl || '/branding/zansafari-logo.png';
  const brandTraLicense = company?.traLicenseNumber || OPERATOR.traLicenseNumber;
  const brandRegistration = company?.registrationNumber || OPERATOR.registrationNumber;
  const brandLocation = company?.location || OPERATOR.location;
  const brandPhone = company?.officialPhone || company?.phone || OPERATOR.phone;
  const brandEmail = company?.officialEmail || company?.email || OPERATOR.email;

  return (
    <footer className="bg-slate-950 text-white pt-16 pb-28 md:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-800/80">
          {/* Column 1: Brand & Operator Story (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <Link
              href="/"
              className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl w-fit"
              aria-label={`${brandBusinessName} Homepage`}
            >
              <div className="h-12 flex items-center shrink-0">
                <img
                  src={brandLogo}
                  alt={brandName}
                  className="h-10 sm:h-11 w-auto max-w-[200px] object-contain rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-white group-hover:text-amber-400 transition-colors leading-tight">
                  {brandBusinessName}
                </span>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  {brandTagline}
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{brandTraLicense || 'TRA-ZNZ-2024-8841'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/50 text-amber-300 text-xs font-semibold">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Reg: {brandRegistration || 'ZNZ-BR-2024-00892'}</span>
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
              {t('footer.exploreTitle')}
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link
                  href="/"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {t('footer.home')}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {t('footer.aboutUs')}
                </Link>
              </li>
              <li>
                <Link
                  href="/tours"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {t('footer.tours')}
                </Link>
              </li>
              <li>
                <Link
                  href="/transportation"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {t('footer.transfers')}
                </Link>
              </li>
              <li>
                <Link
                  href="/reviews"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {t('footer.reviews')}
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {t('footer.faqs')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {t('footer.contact')}
                </Link>
              </li>
              <li>
                <Link
                  href="/book"
                  className="text-amber-400 hover:text-amber-300 font-bold transition-colors"
                >
                  {t('footer.requestBooking')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Featured Tours (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
              {t('footer.experiencesTitle')}
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
              {t('footer.contactTitle')}
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{brandLocation}</span>
              </li>

              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <a
                  href={`tel:${brandPhone}`}
                  className="hover:text-white transition-colors"
                >
                  {brandPhone}
                </a>
              </li>

              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <a
                  href={`mailto:${brandEmail}`}
                  className="hover:text-white transition-colors break-all"
                >
                  {brandEmail}
                </a>
              </li>

              <li className="flex items-center gap-2.5 text-slate-400 text-xs">
                <Globe2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t('footer.languagesSpoken')}</span>
              </li>
            </ul>

            <div className="pt-2">
              <a
                href={getLocalizedWhatsAppLink('default')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-extrabold text-xs shadow-md transition-all active:scale-95 text-center"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>{t('footer.chatWhatsApp')}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Guarantee */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <p>
            &copy; {new Date().getFullYear()} {brandBusinessName}. {t('footer.allRightsReserved')}
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 text-[11px] font-medium"
              title="Staff / Operator Portal Login"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Portal Login</span>
            </Link>

            <span className="text-slate-700 hidden sm:inline">•</span>

            <p className="flex items-center gap-1 text-slate-400">
              <span>{t('footer.madeWithLove')}</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
