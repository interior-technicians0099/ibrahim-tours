import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Trash2,
  Globe2,
  Mail,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Scale,
  Clock,
  Database,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Protection | Ibrahim Tours Zanzibar',
  description:
    'Read our GDPR-compliant privacy policy. Learn how Ibrahim Tours Zanzibar collects, uses, protects, and honors right-to-erasure requests for tourist personal data.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'September 7, 2026';

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. Header Banner */}
      <section className="relative bg-gradient-to-b from-sky-950 via-slate-900 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <nav
            className="flex items-center gap-2 text-xs text-slate-400 mb-6"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-sky-300 font-semibold">Privacy Policy</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>GDPR & Tanzanian PDPA Compliant</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Privacy Policy & Data Protection
          </h1>

          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            Your privacy and trust are paramount. This policy outlines how Ibrahim Tours Zanzibar collects, processes, protects, and respects your rights over your personal data under the EU General Data Protection Regulation (GDPR) and the Tanzanian Personal Data Protection Act (2022).
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Effective Date: {lastUpdated}
            </span>
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              Governing Law: Tanzania & Zanzibar / GDPR (EU 2016/679)
            </span>
          </div>
        </div>
      </section>

      {/* 2. Main Policy Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24 space-y-8">
        {/* Core Principles Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
          <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-sky-600" />
            Our Core Privacy Commitments
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-600">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Zero Data Selling</span>
              We never sell, monetize, or rent your personal data to advertisers or third-party brokers.
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Minimal Collection</span>
              We only collect data strictly necessary to fulfill your tour bookings, airport transfers, and logistics.
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Right to Erasure</span>
              You have the absolute right to request that your personal identification information be permanently deleted.
            </div>
          </div>
        </div>

        {/* Section 1: Data Controller */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-4 text-slate-700 text-sm leading-relaxed">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-sky-600" />
            1. Data Controller Identification
          </h3>
          <p>
            The data controller responsible for the processing of your personal data is:
          </p>
          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 text-xs sm:text-sm text-sky-950 font-medium space-y-1">
            <p className="font-bold text-base text-sky-900">Ibrahim Tours Zanzibar</p>
            <p>Stone Town, Zanzibar, United Republic of Tanzania</p>
            <p>Registration / TRA License: ZCT-OP-2026-0841</p>
            <p>Direct WhatsApp / Telephone: +255 777 000 000</p>
            <p>Privacy & Data Protection Email: <span className="font-mono text-sky-700">privacy@ibrahimtours.co.tz</span></p>
          </div>
        </div>

        {/* Section 2: Data We Collect */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-4 text-slate-700 text-sm leading-relaxed">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-600" />
            2. Categories of Personal Data Collected
          </h3>
          <p>
            When you submit a booking request, contact inquiry, or coordinate an excursion, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-900">Identification & Contact Data:</strong> Full name, email address, phone / WhatsApp number, and country of residence.
            </li>
            <li>
              <strong className="text-slate-900">Travel & Logistics Information:</strong> Excursion dates, pickup time, hotel or villa address, airport flight numbers (for transfers), passenger count, and child age brackets.
            </li>
            <li>
              <strong className="text-slate-900">Special Preferences & Dietary Needs:</strong> Dietary preferences (e.g. seafood BBQ allergies, vegetarian), mobility notes, or child car seat requirements.
            </li>
            <li>
              <strong className="text-slate-900">Financial Records (Post-Service):</strong> Amount paid, payment method (Cash USD/EUR, M-Pesa, Bank Transfer), payment receipt reference, and timestamp. Credit card numbers are never collected or stored on our servers.
            </li>
            <li>
              <strong className="text-slate-900">Technical & Audit Data:</strong> Client IP address and submission timestamp (utilized solely for rate limiting, DDoS defense, and audit log verification).
            </li>
          </ul>
        </div>

        {/* Section 3: Legal Basis */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-4 text-slate-700 text-sm leading-relaxed">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-sky-600" />
            3. Legal Grounds for Processing (GDPR Article 6)
          </h3>
          <ul className="space-y-3">
            <li className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <strong className="text-slate-900 block mb-0.5">Contractual Necessity (Art. 6(1)(b)):</strong>
              Processing is essential to prepare and fulfill your requested tour itineraries, dispatch licensed Zanzibari drivers, and communicate booking status.
            </li>
            <li className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <strong className="text-slate-900 block mb-0.5">Explicit Consent (Art. 6(1)(a)):</strong>
              Obtained via our mandatory booking consent checkbox when submitting personal contact details and dietary notes.
            </li>
            <li className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <strong className="text-slate-900 block mb-0.5">Legal & Statutory Obligations (Art. 6(1)(c)):</strong>
              Compliance with Zanzibar Revenue Authority (TRA) regulations and tourism operator accounting standards.
            </li>
          </ul>
        </div>

        {/* Section 4: Data Retention & Statutory Accounting */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-4 text-slate-700 text-sm leading-relaxed">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600" />
            4. Data Retention & Tax Compliance
          </h3>
          <p>
            We retain your operational travel details only as long as necessary to complete your travel experience and address post-trip inquiries.
          </p>
          <p>
            In accordance with the Tanzanian Tax Administration Act and Zanzibar Revenue Authority requirements, financial settlement ledgers (gross price, tax, operator settlement amounts, and reference codes) are retained for 5 years for statutory tax compliance. All customer PII attached to those ledgers can be permanently anonymized upon request.
          </p>
        </div>

        {/* Section 5: GDPR Rights & Right to Erasure */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-5 text-slate-700 text-sm leading-relaxed">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            5. Your Data Subject Rights (GDPR Articles 15–22)
          </h3>
          <p>
            Under GDPR and the Tanzanian Personal Data Protection Act, you have the following rights:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Right of Access</span>
              Request a copy of all personal information we hold regarding your bookings.
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Right to Rectification</span>
              Request prompt correction of any inaccurate or outdated information.
            </div>
            <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100 text-red-950">
              <span className="font-bold text-red-900 block mb-1">Right to Erasure (Deletion)</span>
              Request that your name, email, phone, hotel, and notes be permanently scrubbed and replaced with &quot;DELETED&quot;.
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Right to Object / Restrict</span>
              Object to any processing or restrict processing of your information.
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
            <strong className="text-slate-900 block mb-1">How to Exercise Your Deletion Right:</strong>
            Send an email with your booking reference code (e.g. <span className="font-mono text-slate-900 font-semibold">ZNZ-2026-XXXXXX</span>) to{' '}
            <span className="font-mono text-sky-700 font-bold">privacy@ibrahimtours.co.tz</span> or message Ibrahim directly on WhatsApp.
            Our platform administrators execute deletion within 48 business hours via our automated GDPR sanitization engine, recording an audited verification entry in our enterprise audit log.
          </div>
        </div>

        {/* Section 6: Security Safeguards */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-4 text-slate-700 text-sm leading-relaxed">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            6. Technical & Operational Security Safeguards
          </h3>
          <p>
            We deploy multiple tiers of enterprise security measures to protect your personal information:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Transport Encryption:</strong> All data transmitted to and from our site is encrypted using TLS 1.3 with Strict Transport Security (HSTS).</li>
            <li><strong>Parameterized Queries:</strong> Database queries are 100% parameterized through Prisma ORM, preventing SQL injection vulnerabilities.</li>
            <li><strong>Role-Based Access Control (RBAC):</strong> Strict isolation between Platform Administrators and Tour Operators; operators cannot view or access financial governance systems.</li>
            <li><strong>Anti-Abuse Rate Limiting:</strong> Sliding-window rate limiters prevent automated credential stuffing and form scraping.</li>
            <li><strong>No Passwords or Financial Credentials Exposed:</strong> Operator passwords are cryptographically hashed using Bcrypt/Argon2 with high-cost work factors.</li>
          </ul>
        </div>

        {/* Section 7: Contact & Questions */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md text-slate-700 text-sm leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">
              Have Questions About Your Data?
            </h3>
            <p className="text-xs text-slate-500">
              We respond to all privacy inquiries and data subject requests promptly.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Contact Privacy Team
            </Link>
            <Link
              href="/book"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all"
            >
              Return to Booking
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
