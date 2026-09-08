'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Locale } from '@/lib/i18n/types';

interface LanguageSelectorProps {
  variant?: 'desktop' | 'mobile';
  onSelect?: () => void;
  className?: string;
}

export default function LanguageSelector({
  variant = 'desktop',
  onSelect,
  className = '',
}: LanguageSelectorProps) {
  const { locale, currentLanguage, languages, setLocale, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);
    if (onSelect) {
      onSelect();
    }
  };

  // Mobile Grid Rendering
  if (variant === 'mobile') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          <Globe className="w-3.5 h-3.5 text-sky-600" />
          <span>{t('common.selectLanguage')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {languages.map((lang) => {
            const isActive = locale === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 active:scale-95'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none" aria-hidden="true">
                    {lang.flag}
                  </span>
                  <div className="flex flex-col text-start leading-tight">
                    <span className="font-extrabold uppercase text-[11px]">{lang.code}</span>
                    <span className={`text-[10px] ${isActive ? 'text-sky-100' : 'text-slate-500'}`}>
                      {lang.nativeName}
                    </span>
                  </div>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop Dropdown Rendering
  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 h-10 px-3 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200/70 text-xs font-extrabold transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-sky-500"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${t('common.language')}: ${currentLanguage.name}`}
      >
        <Globe className="w-4 h-4 text-sky-600" />
        <span className="text-sm leading-none" aria-hidden="true">
          {currentLanguage.flag}
        </span>
        <span className="uppercase tracking-wider">{currentLanguage.code}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t('common.selectLanguage')}
          className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 focus:outline-none"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
            {t('common.selectLanguage')}
          </div>
          <div className="space-y-0.5 max-h-72 overflow-y-auto">
            {languages.map((lang) => {
              const isActive = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none" aria-hidden="true">
                      {lang.flag}
                    </span>
                    <div className="flex flex-col text-start">
                      <span className="font-bold text-slate-900 leading-tight">
                        {lang.nativeName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {lang.name} ({lang.code.toUpperCase()})
                      </span>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-sky-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
