import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Compass,
  Award,
  ShieldCheck,
  Globe2,
  HeartHandshake,
  CheckCircle2,
  CalendarCheck,
  MessageCircle,
  ChevronRight,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  Camera,
  Waves,
  Landmark,
  Trees,
  Car,
  Building,
  Users,
} from 'lucide-react';
import { getCompanyProfile } from '@/lib/company';

export const metadata: Metadata = {
  title: 'About Zansafari Horizon | Licensed Tour Operator in Zanzibar',
  description:
    'Zansafari Horizon is a fully registered and licensed Zanzibar tour operator and safari specialist (TRA licensed). Offering authentic private island excursions, cultural heritage tours, and reliable airport transfers.',
};

export default async function AboutPage() {
  const company = await getCompanyProfile();

  const aboutWhatsAppMsg = `Hello ${company.companyName}! I am interested in planning a private trip to Zanzibar with your team.`;
  const cleanPhone = company.officialWhatsapp.replace(/[^0-9]/g, '');
  const whatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(aboutWhatsAppMsg)}`;

  const areasServed = [
    { name: 'Stone Town', desc: 'Historic alleys, spice markets, and sultan heritage' },
    { name: 'Nungwi & Kendwa', desc: 'North coast turquoise beaches & turtle sanctuaries' },
    { name: 'Pwani Mchangani & Matemwe', desc: 'Northeast barrier reefs & Mnemba atoll' },
    { name: 'Paje & Jambiani', desc: 'Southeast lagoon sands, kitesurfing & The Rock' },
    { name: 'Kizimkazi', desc: 'South coast dolphin bays & ancient Swahili mosques' },
  ];

  const specialties = [
    {
      title: 'Marine Safaris & Sandbanks',
      desc: 'Snorkeling at Mnemba Atoll, Safari Blue dhow sailing, and dolphin spotting in Kizimkazi.',
      icon: Waves,
    },
    {
      title: 'Stone Town & Cultural Heritage',
      desc: 'Walking through ancient coral-stone corridors, spice farms, and Prison Island giant tortoises.',
      icon: Landmark,
    },
    {
      title: 'Wildlife & Forest Treks',
      desc: 'Encountering rare Red Colobus monkeys in Jozani Chwaka Bay National Park.',
      icon: Trees,
    },
    {
      title: 'Island-Wide Private Transfers',
      desc: 'Seamless air-conditioned airport pickups and hotel-to-hotel shuttles.',
      icon: Car,
    },
  ];

  const galleryItems = [
    { label: 'Stone Town Alleys', subtitle: 'UNESCO World Heritage' },
    { label: 'Nakupenda Sandbank', subtitle: 'Crystal Turquoise Waters' },
    { label: 'Zanzibar Spice Farms', subtitle: 'Cloves, Vanilla & Cinnamon' },
    { label: 'Mnemba Atoll Snorkeling', subtitle: 'Vibrant Coral Reefs' },
    { label: 'Jozani Forest Monkeys', subtitle: 'Red Colobus Sanctuary' },
    { label: 'Sunset Dhow Cruise', subtitle: 'Swahili Ocean Music' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. Header Banner */}
      <section className="relative bg-gradient-to-b from-sky-950 via-slate-900 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <nav
            className="flex items-center gap-2 text-xs text-slate-400 mb-6"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-amber-300 font-semibold">About Us</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold uppercase tracking-wider mb-4">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Registered Tour Operator & Safari Specialist</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              About {company.companyName}
            </h1>

            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              {company.tagline} • Delivering exceptional, private, and fully licensed island journeys, cultural heritage discoveries, and wildlife adventures across Zanzibar.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24 space-y-16">
        {/* 2. Company Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-14 border border-slate-200/80 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Company Visual Brand Card */}
            <div className="lg:col-span-5 flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-sky-600 p-2 shadow-2xl">
                  <div className="w-full h-full rounded-[22px] bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center shadow-xl mb-4">
                      <img
                        src={company.logoUrl || '/branding/zansafari-logo.png'}
                        alt={company.companyName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-extrabold text-2xl text-white">
                      {company.companyName}
                    </span>
                    <span className="text-xs text-amber-300 font-bold uppercase tracking-wider mt-1">
                      {company.tagline}
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Stone Town, Zanzibar • Tanzania
                    </span>
                  </div>
                </div>

                <div className="absolute -bottom-3 -right-3 bg-amber-500 text-slate-950 py-2.5 px-4 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xl flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>10+ Years Heritage</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {company.registrationNumber && (
                  <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-900 text-xs font-extrabold border border-amber-300 flex items-center gap-1.5 shadow-sm">
                    <Building className="w-4 h-4 text-amber-600" />
                    <span>Company Reg: {company.registrationNumber}</span>
                  </span>
                )}
                {company.traLicenseNumber && (
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-900 text-xs font-extrabold border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>TRA Licensed: {company.traLicenseNumber}</span>
                  </span>
                )}
                <span className="px-3.5 py-1.5 rounded-full bg-sky-50 text-sky-800 text-xs font-bold border border-sky-200 flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5 text-sky-600" />
                  Multilingual: EN, SW, IT, FR, DE, AR
                </span>
              </div>
            </div>

            {/* Biography Text & Company Story */}
            <div className="lg:col-span-7 space-y-6 text-slate-600 text-sm sm:text-base leading-relaxed">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Our Corporate Story
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Excellence, Integrity & Authentic Island Hospitality
                </h2>
              </div>

              <p>
                Karibu sana! <strong>{company.companyName}</strong> is an officially registered and licensed Zanzibar tour operator and safari company headquartered in historic Stone Town. Founded on a deep reverence for Zanzibar&apos;s rich cultural tapestry and marine ecosystems, we specialize in curated, private, high-standard travel experiences.
              </p>

              <p>
                Over the past decade, our operations have welcomed thousands of international guests from Europe, the Americas, the Middle East, and beyond. With our multilingual operations desk and team of veteran licensed local guides, we provide authentic cultural immersion, private dhow charters, and reliable modern transport.
              </p>

              <p>
                Our philosophy centers on traveler satisfaction, environmental stewardship, and fair community partnerships. We operate strictly private excursions with transparent pricing, zero hidden fees, and seamless guest communication.
              </p>

              {/* Contact CTA buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3.5">
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-bold text-sm shadow-md transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Chat on WhatsApp</span>
                </a>

                <a
                  href={`tel:${company.officialPhone}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call: {company.officialPhone}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Areas Served */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
              Island-Wide Service
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Key Regions We Cover Across Zanzibar
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              We provide private pickup and tour operations across all major hotel hubs and coastal villages.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {areasServed.map((area, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-sky-300 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold mb-3">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base mb-1">
                  {area.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {area.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Specialties */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
              Our Core Expertise
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              What We Specialize In
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specialties.map((spec, i) => {
              const Icon = spec.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs flex items-start gap-4 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base mb-1">
                      {spec.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      {spec.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Why Choose Zansafari Horizon */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Trust & Standards
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Why Travelers Choose {company.companyName}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">
                100% Private Excursions
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                No crowded tourist groups. You set the departure time, take photo stops at your leisure, and enjoy comfortable, dedicated attention.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">
                TRA Licensed & Fully Registered
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Official company registration ({company.registrationNumber || 'ZNZ-BR-2024-00892'}) and Tanzania Revenue Authority tour operator licensing ({company.traLicenseNumber || 'TRA-ZNZ-2024-8841'}).
              </p>
            </div>

            <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">
                Certified Guides & Modern Fleet
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Certified local guides with deep historical expertise, pristine air-conditioned vans, and vetted sea safari dhow crews.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Gallery Grid */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
              Island Moments
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Moments from our Zanzibar Adventures
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {galleryItems.map((item, idx) => (
              <div
                key={idx}
                className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-sky-950 via-slate-900 to-slate-900 p-4 border border-slate-800 shadow-md flex flex-col justify-between group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px] opacity-20 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10 w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="relative z-10">
                  <span className="text-white font-bold text-xs sm:text-sm block">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {item.subtitle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
