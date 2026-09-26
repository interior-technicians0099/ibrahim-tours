import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';
import { Role } from '@prisma/client';
import {
  Plus,
  Clock,
  Sparkles,
  ExternalLink,
  Edit,
  ImageIcon,
} from 'lucide-react';
import PlatformNav from '@/components/platform/PlatformNav';

export const metadata: Metadata = {
  title: 'Excursions & Tours | Platform Administration',
  description: 'Super-admin tour catalog management.',
  robots: { index: false, follow: false },
};

export default async function PlatformToursPage() {
  const user = await requireRole([Role.PLATFORM_ADMIN]);

  const dbTours = await prisma.tour.findMany({
    include: { images: { orderBy: { sortOrder: 'asc' } }, category: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PlatformNav adminName={user.name || undefined} adminEmail={user.email || undefined} />

      <div className="bg-slate-900/40 border-b border-slate-800/80 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Manage Excursions & Tours
            </h1>
            <p className="text-xs text-slate-400">
              Catalog of safaris and packages ({dbTours.length} tours)
            </p>
          </div>

          <Link
            href="/platform/content/tours/new"
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tour</span>
          </Link>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Catalog ({dbTours.length} Excursions)
          </span>
        </div>

        {dbTours.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No tours found in catalog</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Get started by adding your first excursion tour with photos and pricing tiers.
            </p>
            <Link
              href="/platform/content/tours/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Tour</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dbTours.map((t) => {
              const heroImage = t.images.find((img) => img.isHero) || t.images[0];
              return (
                <div
                  key={t.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-slate-950 w-full overflow-hidden">
                    {heroImage?.url ? (
                      <Image
                        src={heroImage.url}
                        alt={heroImage.alt || t.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 350px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}

                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border shadow-md ${
                          t.isActive
                            ? 'bg-emerald-500/90 text-slate-950 border-emerald-400'
                            : 'bg-rose-500/90 text-white border-rose-400'
                        }`}
                      >
                        {t.isActive ? 'Active' : 'Draft / Inactive'}
                      </span>

                      {t.isFeatured && (
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/90 text-slate-950 border border-amber-400 flex items-center gap-0.5 shadow-md">
                          <Sparkles className="w-3 h-3 fill-slate-950" />
                          <span>Featured</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-slate-300">
                      {t.images.length} {t.images.length === 1 ? 'photo' : 'photos'}
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                        {t.category?.name || 'Excursion'}
                      </div>

                      <h3 className="font-extrabold text-white text-base leading-snug">
                        {t.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.durationText}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                          Starting From
                        </span>
                        <span className="text-base font-black text-emerald-400">
                          {formatPrice(Math.round(t.startingPriceCents / 100))}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tours/${t.slug}`}
                          target="_blank"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View Live Page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <Link
                          href={`/platform/content/tours/${t.id}`}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
