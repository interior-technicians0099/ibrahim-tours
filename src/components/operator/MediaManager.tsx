'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  X,
  Star,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  ImageIcon,
} from 'lucide-react';

export interface MediaItem {
  id: string;
  url: string;
  publicId?: string;
  alt?: string;
  isHero?: boolean;
  sortOrder?: number;
}

interface MediaManagerProps {
  items: MediaItem[];
  onChange: (updatedItems: MediaItem[]) => void;
  entityType: 'TOUR' | 'VEHICLE' | 'OPERATOR_PROFILE' | 'TRA_LICENSE' | 'GENERAL';
  entityId?: string;
  allowMultiple?: boolean;
  label?: string;
  helperText?: string;
}

export default function MediaManager({
  items,
  onChange,
  entityType,
  entityId,
  allowMultiple = true,
  label = 'Media & Photos',
  helperText = 'Upload JPG, PNG, or WebP images up to 10MB each.',
}: MediaManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle files upload
  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgress(10);

    const fileList = Array.from(files);
    const validFiles = fileList.filter((file) => {
      const isAllowed = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isUnderSize = file.size <= 10 * 1024 * 1024;
      return isAllowed && isUnderSize;
    });

    if (validFiles.length === 0) {
      setErrorMessage('Please select valid image files (JPG, PNG, WebP) under 10MB.');
      setIsUploading(false);
      setUploadProgress(null);
      return;
    }

    const newUploadedItems: MediaItem[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      if (entityId) formData.append('entityId', entityId);
      // If first item and list is empty, default to hero
      const shouldBeHero = items.length === 0 && i === 0;
      formData.append('isHero', String(shouldBeHero));

      try {
        setUploadProgress(Math.round(((i + 1) / validFiles.length) * 80));
        const res = await fetch('/api/operator/media/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to upload image.');
        }

        newUploadedItems.push({
          id: data.id || data.publicId,
          url: data.secureUrl || data.url,
          publicId: data.publicId,
          alt: data.alt || '',
          isHero: shouldBeHero,
          sortOrder: items.length + i,
        });
      } catch (err: any) {
        setErrorMessage(err?.message || 'Error uploading image.');
      }
    }

    setUploadProgress(100);
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(null);
      if (newUploadedItems.length > 0) {
        if (!allowMultiple) {
          onChange(newUploadedItems.slice(0, 1));
        } else {
          onChange([...items, ...newUploadedItems]);
        }
      }
    }, 400);
  };

  // Set hero image
  const handleSetHero = (id: string) => {
    const updated = items.map((item) => ({
      ...item,
      isHero: item.id === id,
    }));
    onChange(updated);
  };

  // Reorder up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const copy = [...items];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    onChange(copy);
  };

  // Reorder down
  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const copy = [...items];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    onChange(copy);
  };

  // Update alt text
  const handleAltChange = (id: string, alt: string) => {
    const updated = items.map((item) => (item.id === id ? { ...item, alt } : item));
    onChange(updated);
  };

  // Delete image
  const handleDelete = async (id: string, publicId?: string) => {
    if (!confirm('Are you sure you want to delete this photo? This will permanently remove it.')) {
      return;
    }

    const targetId = publicId || id;
    try {
      await fetch(`/api/operator/media/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Silent delete error:', err);
    }

    const remaining = items.filter((item) => item.id !== id);
    // If deleted item was hero, set first item as hero
    if (items.find((i) => i.id === id)?.isHero && remaining.length > 0) {
      remaining[0].isHero = true;
    }
    onChange(remaining);
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            {label}
          </label>
          {helperText && <p className="text-[11px] text-slate-400 mt-0.5">{helperText}</p>}
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {items.length} {items.length === 1 ? 'photo' : 'photos'}
        </span>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Drop Zone / Upload Area */}
      {(!allowMultiple && items.length >= 1) ? null : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={allowMultiple}
            onChange={(e) => {
              if (e.target.files) {
                handleFiles(e.target.files);
              }
            }}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-emerald-400">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            <div>
              <span className="text-xs font-bold text-white block">
                {isUploading ? 'Uploading to Cloudinary...' : 'Tap to upload from phone or drag & drop'}
              </span>
              <span className="text-[11px] text-slate-400">
                {allowMultiple
                  ? 'Select one or multiple photos (JPG, PNG, WebP up to 10MB)'
                  : 'Select photo (JPG, PNG, WebP up to 10MB)'}
              </span>
            </div>

            {uploadProgress !== null && (
              <div className="w-full max-w-xs mt-2 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-3 relative group hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-850">
                {item.url ? (
                  <Image
                    src={item.url}
                    alt={item.alt || 'Tour photo'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 300px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}

                {/* Cover / Hero Badge */}
                {item.isHero && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-lg">
                    <Star className="w-3 h-3 fill-slate-950" />
                    <span>Cover Hero</span>
                  </div>
                )}

                {/* Quick Action Overlay */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {!item.isHero && (
                    <button
                      type="button"
                      onClick={() => handleSetHero(item.id)}
                      title="Set as Hero Cover"
                      className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-amber-400 hover:bg-slate-900 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.publicId)}
                    title="Delete image"
                    className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Alt Text & Ordering Controls */}
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Alt Text (SEO & Accessibility)
                  </label>
                  <input
                    type="text"
                    value={item.alt || ''}
                    onChange={(e) => handleAltChange(item.id, e.target.value)}
                    placeholder="e.g. Stone Town spice market spices"
                    className="w-full bg-slate-950 border border-slate-700/70 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {allowMultiple && items.length > 1 && (
                  <div className="flex items-center justify-between pt-1 text-slate-400 text-xs">
                    <span className="text-[10px] text-slate-500">Order: #{index + 1}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveUp(index)}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 transition-colors"
                        title="Move left/up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === items.length - 1}
                        onClick={() => handleMoveDown(index)}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 transition-colors"
                        title="Move right/down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
