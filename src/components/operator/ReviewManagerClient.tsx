'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Star,
  Globe,
  Trash2,
  Save,
  X,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import {
  saveReviewAction,
  toggleReviewPublishedAction,
  deleteReviewAction,
} from '@/lib/actions/review-actions';

interface ReviewItem {
  id: string;
  reviewerName: string;
  reviewerCountry?: string | null;
  rating: number;
  title?: string | null;
  body: string;
  source?: string | null;
  sourceUrl?: string | null;
  serviceTitle: string;
  tourId?: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  adminResponse?: string | null;
  createdAt: string;
}

interface Props {
  initialReviews: ReviewItem[];
  tours: Array<{ id: string; title: string }>;
}

export default function ReviewManagerClient({ initialReviews, tours }: Props) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // Form State
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerCountry, setReviewerCountry] = useState('Italy');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tourId, setTourId] = useState('');
  const [source, setSource] = useState('TripAdvisor');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const startNew = () => {
    setEditingReviewId('NEW');
    setReviewerName('');
    setReviewerCountry('Germany');
    setRating(5);
    setTitle('');
    setBody('');
    setTourId(tours[0]?.id || '');
    setSource('TripAdvisor');
    setSourceUrl('');
    setIsPublished(true);
    setIsFeatured(false);
    setAdminResponse('');
    setErrorMessage(null);
  };

  const startEdit = (r: ReviewItem) => {
    setEditingReviewId(r.id);
    setReviewerName(r.reviewerName);
    setReviewerCountry(r.reviewerCountry || '');
    setRating(r.rating);
    setTitle(r.title || '');
    setBody(r.body);
    setTourId(r.tourId || '');
    setSource(r.source || 'TripAdvisor');
    setSourceUrl(r.sourceUrl || '');
    setIsPublished(r.isPublished);
    setIsFeatured(r.isFeatured);
    setAdminResponse(r.adminResponse || '');
    setErrorMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !body.trim()) {
      setErrorMessage('Reviewer name and review body are required.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const result = await saveReviewAction({
        id: editingReviewId !== 'NEW' ? editingReviewId! : undefined,
        reviewerName,
        reviewerCountry,
        rating,
        title,
        body,
        tourId: tourId || undefined,
        source,
        sourceUrl,
        isPublished,
        isFeatured,
        adminResponse,
      });

      if (result.success && result.review) {
        const assignedTour = tours.find((t) => t.id === tourId);
        const updatedItem: ReviewItem = {
          id: result.review.id,
          reviewerName: result.review.reviewerName,
          reviewerCountry: result.review.reviewerCountry,
          rating: result.review.rating || 5,
          title: result.review.title,
          body: result.review.body,
          source: result.review.source,
          sourceUrl: result.review.sourceUrl,
          serviceTitle: assignedTour?.title || 'Zanzibar Tour Excursion',
          tourId: result.review.tourId,
          isPublished: result.review.isPublished,
          isFeatured: result.review.isFeatured,
          adminResponse: result.review.adminResponse,
          createdAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        };

        if (editingReviewId === 'NEW') {
          setReviews([updatedItem, ...reviews]);
        } else {
          setReviews(reviews.map((r) => (r.id === editingReviewId ? updatedItem : r)));
        }

        setSuccessMessage('Review saved successfully.');
        setTimeout(() => setSuccessMessage(null), 3000);
        setEditingReviewId(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save review.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    try {
      await toggleReviewPublishedAction(id, !current);
      setReviews(reviews.map((r) => (r.id === id ? { ...r, isPublished: !current } : r)));
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to toggle status.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete review from "${name}"?`)) return;
    try {
      await deleteReviewAction(id);
      setReviews(reviews.filter((r) => r.id !== id));
      setSuccessMessage('Review deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to delete review.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/operator"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">Guest Reviews & Feedback</h1>
            <p className="text-xs text-slate-400">Import TripAdvisor/Google reviews and publish testimonials</p>
          </div>
        </div>

        <button
          type="button"
          onClick={startNew}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Review</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Modal / Accordion */}
        {editingReviewId && (
          <form
            onSubmit={handleSave}
            className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">
                {editingReviewId === 'NEW' ? 'Add Verified Review / Testimonial' : 'Edit Review'}
              </h2>
              <button
                type="button"
                onClick={() => setEditingReviewId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reviewer Name *
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Elena Rossi"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Country of Origin
                </label>
                <input
                  type="text"
                  value={reviewerCountry}
                  onChange={(e) => setReviewerCountry(e.target.value)}
                  placeholder="e.g. Italy, United Kingdom, France"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Star Rating (1–5)
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value={5}>★★★★★ (5 Stars - Outstanding)</option>
                  <option value={4}>★★★★☆ (4 Stars - Very Good)</option>
                  <option value={3}>★★★☆☆ (3 Stars - Average)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Excursion / Service
                </label>
                <select
                  value={tourId}
                  onChange={(e) => setTourId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">General Zanzibar Hospitality</option>
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Source</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="TripAdvisor, Google Reviews, Direct Booking"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Source Link / Verification URL (Optional)
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://tripadvisor.com/ShowUserReviews-..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Review Headline / Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The absolute highlight of our honeymoon in Zanzibar!"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Review Text / Feedback *
                </label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  placeholder="Ibrahim was phenomenal! Punctual, knowledgeable, and made us feel like family..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ibrahim&apos;s Host Response (Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Thank you so much Elena! It was an absolute pleasure showing you Stone Town..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 bg-slate-950"
                  />
                  <span className="text-xs font-semibold text-slate-300">Published Live</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 bg-slate-950"
                  />
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Feature on Homepage</span>
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingReviewId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Review'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Reviews Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {r.isFeatured && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Featured</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(r.id, r.isPublished)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        r.isPublished
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {r.isPublished ? 'Published' : 'Hidden'}
                    </button>
                  </div>
                </div>

                {r.title && <h4 className="text-xs font-extrabold text-white">{r.title}</h4>}

                <p className="text-xs text-slate-300 italic leading-relaxed">
                  &ldquo;{r.body}&rdquo;
                </p>

                {r.adminResponse && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
                    <span className="font-bold text-emerald-400 block">Response from Ibrahim:</span>
                    <p className="text-slate-400">{r.adminResponse}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{r.reviewerName}</span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-500" />
                    <span>{r.reviewerCountry}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{r.source}</span>
                  {r.sourceUrl && (
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => startEdit(r)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Edit Review"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id, r.reviewerName)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
