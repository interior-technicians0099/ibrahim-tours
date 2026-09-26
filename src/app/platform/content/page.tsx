import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import PlatformNav from '@/components/platform/PlatformNav';

export const metadata: Metadata = {
  title: 'Content Management | Platform Administration',
  description: 'Super-admin catalog, transfers, reviews, FAQs and categories.',
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { href: '/platform/content/tours', title: 'Excursions & Tours', desc: 'Catalog, pricing tiers, photos, featured flags.' },
  { href: '/platform/content/transport', title: 'Transfers & Fleet', desc: 'Routes, 4-tier pricing, vehicles.' },
  { href: '/platform/content/categories', title: 'Categories', desc: 'Tour taxonomy and sorting.' },
  { href: '/platform/content/faqs', title: 'FAQs', desc: 'Tourist knowledgebase.' },
  { href: '/platform/content/reviews', title: 'Reviews', desc: 'Publish, feature, respond.' },
];

export default async function PlatformContentIndexPage() {
  const user = await requireRole([Role.PLATFORM_ADMIN]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PlatformNav adminName={user.name || undefined} adminEmail={user.email || undefined} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Content</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Super-admin catalog and site content. The operator portal has no access to these sections.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all group"
            >
              <div className="font-bold text-white group-hover:text-indigo-300">{s.title}</div>
              <div className="text-xs text-slate-400 mt-1">{s.desc}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
