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
} from 'lucide-react';
import { OPERATOR } from '@/lib/constants';
import { getWhatsAppLink } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Meet Ibrahim | Licensed Local Guide & Tour Operator in Zanzibar',
  description:
    'Meet Ibrahim, your licensed local Zanzibari guide with 10+ years of experience. Fluent in English, Swahili, and Italian. Private tours in Stone Town, Nungwi, Paje, and island-wide.',
};

export default function AboutPage() {
  const aboutWhatsAppMsg =
    'Hello Ibrahim! I read your story on the website and would love to plan our private Zanzibar trip with you.';

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
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
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
            <span className="text-sky-300 font-semibold">Meet Ibrahim</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-bold uppercase tracking-wider mb-4">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Native Islander & Lead Guide</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Meet Ibrahim: Your Trusted Zanzibar Guide
            </h1>

            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Born and raised in Stone Town, guiding international travelers for over 10 years with personalized attention, genuine hospitality, and deep cultural knowledge.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24 space-y-16">
        {/* 2. Bio & Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-14 border border-slate-200/80 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Guide Photo Placeholder */}
            <div className="lg:col-span-5 flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl bg-gradient-to-tr from-sky-600 to-amber-400 p-2 shadow-2xl">
                  <div className="w-full h-full rounded-[22px] bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-400 to-cyan-200 flex items-center justify-center text-slate-950 font-black text-4xl shadow-xl mb-4">
                      IT
                    </div>
                    <span className="font-extrabold text-2xl text-white">
                      {OPERATOR.name}
                    </span>
                    <span className="text-xs text-amber-300 font-bold uppercase tracking-wider mt-1">
                      Licensed Tour Operator
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Stone Town, Zanzibar
                    </span>
                  </div>
                </div>

                <div className="absolute -bottom-3 -right-3 bg-amber-500 text-slate-950 py-2.5 px-4 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xl flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>{OPERATOR.experience}</span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Licensed Operator
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200 flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5" />
                  Fluent in English, Swahili, Italian
                </span>
              </div>
            </div>

            {/* Biography Text & Story */}
            <div className="lg:col-span-7 space-y-6 text-slate-600 text-sm sm:text-base leading-relaxed">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                  The Story Behind Ibrahim Tours
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Authentic Hospitality from a Stone Town Native
                </h2>
              </div>

              <p>
                Karibu! My name is <strong>Ibrahim</strong>. I was born and raised right here in Stone Town, exploring the ancient alleyways, spice plantations, and coral waters of Zanzibar since my childhood.
              </p>

              <p>
                Over the past <strong>10+ years</strong>, I have guided thousands of couples, families, and solo travelers from the UK, Italy, Sweden, Germany, the USA, and across the globe. Being fluent in <strong>English, Swahili, and Italian</strong> allows me to communicate clearly and share the rich nuances of Zanzibari history.
              </p>

              <p>
                My philosophy is simple: <em>Treat every traveler like family visiting our island.</em> We don't do crowded big-bus tours with high commissions. When you book with me, you get direct private attention, flexible pacing, fair public prices, and zero upfront payment.
              </p>

              {/* Contact CTA buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3.5">
                <a
                  href={getWhatsAppLink(aboutWhatsAppMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-bold text-sm shadow-md transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Chat with Ibrahim on WhatsApp</span>
                </a>

                <a
                  href={`tel:${OPERATOR.phone}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call: {OPERATOR.phone}</span>
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

        {/* 5. "Why Choose Me" Cards */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
              Trust & Quality
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Why Travelers Choose Ibrahim Tours
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">
                100% Private Attention
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                No sharing with strangers. You set the start time, stop whenever you wish for photography, and enjoy tailored pacing for couples and families.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">
                Pay on Arrival
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Zero upfront prepayment required. We confirm your date and you pay upon meeting Ibrahim in USD, EUR, GBP, or M-Pesa.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">
                Authentic Native Guide
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Real local connections with spice farmers, dhow captains, and conservation rangers for an authentic Swahili experience.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Gallery Placeholder Grid */}
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
