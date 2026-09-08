'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  X,
  Sparkles,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import MediaManager, { MediaItem } from '@/components/operator/MediaManager';
import { saveTourAction, deleteTourAction, TourFormData } from '@/lib/actions/tour-actions';

interface CategoryOption {
  id: string;
  name: string;
}

interface Props {
  initialTour?: {
    id?: string;
    slug: string;
    title: string;
    shortDescription?: string | null;
    description: string;
    categoryId: string;
    durationText: string;
    startingPriceCents: number;
    isFeatured: boolean;
    isActive: boolean;
    seoTitle?: string | null;
    seoDescription?: string | null;
    pricingTiers: Record<string, { priceCents: number; costCents?: number; label?: string }>;
    highlights: string[];
    inclusions: string[];
    exclusions?: string[];
    images: MediaItem[];
  };
  categories: CategoryOption[];
}

export default function TourEditorClient({ initialTour, categories }: Props) {
  const router = useRouter();
  const isEditing = Boolean(initialTour?.id);

  const [title, setTitle] = useState(initialTour?.title || '');
  const [slug, setSlug] = useState(initialTour?.slug || '');
  const [categoryId, setCategoryId] = useState(
    initialTour?.categoryId || categories[0]?.id || ''
  );
  const [durationText, setDurationText] = useState(initialTour?.durationText || 'Full Day (6–8 Hours)');
  const [startingPriceDollars, setStartingPriceDollars] = useState(
    initialTour ? Math.round(initialTour.startingPriceCents / 100) : 120
  );
  const [shortDescription, setShortDescription] = useState(initialTour?.shortDescription || '');
  const [description, setDescription] = useState(initialTour?.description || '');
  const [isFeatured, setIsFeatured] = useState(Boolean(initialTour?.isFeatured));
  const [isActive, setIsActive] = useState(initialTour?.isActive !== undefined ? initialTour.isActive : true);
  const [seoTitle, setSeoTitle] = useState(initialTour?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialTour?.seoDescription || '');

  // Pricing Tiers State
  const defaultTiers = initialTour?.pricingTiers || {
    single: { label: 'Solo Traveler (1 Person)', priceCents: 12000, costCents: 9000 },
    couple: { label: 'Couple / 2 Persons', priceCents: 16000, costCents: 10000 },
  };

  const [tiers, setTiers] = useState<
    Array<{
      key: string;
      label: string;
      priceDollars: number;
      costDollars: number;
    }>
  >(() => {
    return Object.entries(defaultTiers).map(([k, v]: [string, any]) => ({
      key: k,
      label: v.label || k,
      priceDollars: Math.round((v.priceCents || 0) / 100),
      costDollars: Math.round((v.costCents || 0) / 100),
    }));
  });

  // Highlights & Inclusions
  const [highlights, setHighlights] = useState<string[]>(
    initialTour?.highlights && initialTour.highlights.length > 0
      ? initialTour.highlights
      : ['Private luxury transport', 'Licensed historical guide']
  );
  const [newHighlight, setNewHighlight] = useState('');

  const [inclusions, setInclusions] = useState<string[]>(
    initialTour?.inclusions && initialTour.inclusions.length > 0
      ? initialTour.inclusions
      : ['Bottled mineral water', 'Government conservation permits']
  );
  const [newInclusion, setNewInclusion] = useState('');

  // Images state
  const [images, setImages] = useState<MediaItem[]>(() => {
    return (initialTour?.images || []).filter((img) => !img.url.startsWith('/images/'));
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-slug generator
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  };

  // Tier helpers
  const handleTierChange = (index: number, field: string, value: any) => {
    const copy = [...tiers];
    copy[index] = { ...copy[index], [field]: value };
    setTiers(copy);
  };

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        key: `tier_${Date.now()}`,
        label: 'New Passenger Tier',
        priceDollars: 150,
        costDollars: 100,
      },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter((_, i) => i !== index));
  };

  // Highlights helpers
  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setHighlights([...highlights, newHighlight.trim()]);
    setNewHighlight('');
  };
  const removeHighlight = (idx: number) => {
    setHighlights(highlights.filter((_, i) => i !== idx));
  };

  // Inclusions helpers
  const addInclusion = () => {
    if (!newInclusion.trim()) return;
    setInclusions([...inclusions, newInclusion.trim()]);
    setNewInclusion('');
  };
  const removeInclusion = (idx: number) => {
    setInclusions(inclusions.filter((_, i) => i !== idx));
  };

  // Save tour handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !description.trim()) {
      setErrorMessage('Please fill in required fields: Title, Slug, and Description.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Format pricingTiers object
    const pricingTiersObj: Record<string, { priceCents: number; costCents: number; label: string }> = {};
    tiers.forEach((t) => {
      const key = t.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'standard';
      pricingTiersObj[key] = {
        label: t.label,
        priceCents: Math.round(t.priceDollars * 100),
        costCents: Math.round(t.costDollars * 100),
      };
    });

    const payload: TourFormData = {
      id: initialTour?.id,
      slug,
      title,
      shortDescription,
      description,
      categoryId,
      durationText,
      startingPriceCents: Math.round(startingPriceDollars * 100),
      isFeatured,
      isActive,
      seoTitle,
      seoDescription,
      pricingTiers: pricingTiersObj,
      highlights,
      inclusions,
      images,
    };

    try {
      const result = await saveTourAction(payload);
      if (result.success) {
        setSuccessMessage('Excursion tour saved successfully.');
        setTimeout(() => {
          router.push('/operator/tours');
          router.refresh();
        }, 1000);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save tour.');
      setIsSaving(false);
    }
  };

  // Delete tour handler
  const handleDelete = async () => {
    if (!initialTour?.id) return;
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;

    setIsDeleting(true);
    try {
      await deleteTourAction(initialTour.id);
      router.push('/operator/tours');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to delete tour.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Sticky Mobile Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/operator/tours"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">
              {isEditing ? `Edit: ${initialTour?.title || ''}` : 'Create New Excursion'}
            </h1>
            <p className="text-[11px] text-slate-400">Manage catalog content, tiers & gallery</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              type="button"
              disabled={isDeleting || isSaving}
              onClick={handleDelete}
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
              title="Delete Tour"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isDeleting}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Tour</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* 1. Basic Tour Details */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white pb-2 border-b border-slate-800">
              1. Basic Excursion Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tour Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Stone Town Heritage & Spice Farm Tour"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="stone-town-spice-tour"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Duration Text
                </label>
                <input
                  type="text"
                  value={durationText}
                  onChange={(e) => setDurationText(e.target.value)}
                  placeholder="Full Day (6–8 Hours)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Starting Price Display ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  value={startingPriceDollars}
                  onChange={(e) => setStartingPriceDollars(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold text-emerald-400"
                />
              </div>

              {/* Status Toggles */}
              <div className="sm:col-span-2 flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
                  />
                  <span className="text-xs font-semibold text-slate-300">Published / Active</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                  />
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Featured on Homepage</span>
                  </span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Short Teaser Summary
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Experience the exotic scents and historical architecture of Zanzibar..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Detailed Description *
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Provide complete excursion breakdown, itinerary, and traveler expectations..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Pricing & Confidential Cost Matrix */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  2. Pricing & Confidential Cost Matrix
                </h2>
                <p className="text-[11px] text-slate-400">
                  Guest sees Price only. Private Cost & Computed Profit are strictly confidential to Ibrahim.
                </p>
              </div>
              <button
                type="button"
                onClick={addTier}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tier</span>
              </button>
            </div>

            <div className="space-y-3">
              {tiers.map((tier, idx) => {
                const profit = tier.priceDollars - tier.costDollars;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4 justify-between"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tier.label}
                          onChange={(e) => handleTierChange(idx, 'label', e.target.value)}
                          placeholder="Tier Label (e.g. Solo Traveler)"
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">
                        Key: {tier.key}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">
                          Public Price ($)
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={tier.priceDollars}
                          onChange={(e) =>
                            handleTierChange(idx, 'priceDollars', Number(e.target.value))
                          }
                          className="w-24 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <span className="block text-[10px] uppercase font-bold text-amber-400">
                          Private Cost ($)
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={tier.costDollars}
                          onChange={(e) =>
                            handleTierChange(idx, 'costDollars', Number(e.target.value))
                          }
                          className="w-24 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="block text-[10px] uppercase font-bold text-slate-500">
                          Profit
                        </span>
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-md ${
                            profit >= 0
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          ${profit}
                        </span>
                      </div>

                      {tiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTier(idx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Media & Cloudinary Photo Gallery */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white pb-2 border-b border-slate-800">
              3. Cloudinary Photo Gallery & Hero Image
            </h2>

            <MediaManager
              items={images}
              onChange={setImages}
              entityType="TOUR"
              entityId={initialTour?.id}
              allowMultiple={true}
              label="Tour Gallery Photos"
              helperText="Upload excursion imagery. Pick one cover hero photo, arrange sort order, and add descriptive alt text."
            />
          </div>

          {/* 4. Highlights & Inclusions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Highlights */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Tour Highlights
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addHighlight();
                    }
                  }}
                  placeholder="e.g. Traditional wooden dhow cruise"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={addHighlight}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Add
                </button>
              </div>
              <ul className="space-y-1.5">
                {highlights.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <span>• {h}</span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(i)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Inclusions */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Included in Price
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInclusion}
                  onChange={(e) => setNewInclusion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addInclusion();
                    }
                  }}
                  placeholder="e.g. Hotel pickup & drop-off"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={addInclusion}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Add
                </button>
              </div>
              <ul className="space-y-1.5">
                {inclusions.map((inc, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <span>✓ {inc}</span>
                    <button
                      type="button"
                      onClick={() => removeInclusion(i)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 5. SEO Metadata */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
              5. Search Engine Optimization (SEO)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Meta Title Tag
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Stone Town Tour Zanzibar | Ibrahim Tours"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Meta Description
                </label>
                <input
                  type="text"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Book private Stone Town historical guided excursion with certified local guide Ibrahim..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <Link
              href="/operator/tours"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Excursion Tour</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
