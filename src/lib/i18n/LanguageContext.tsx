'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Locale,
  Direction,
  LanguageMeta,
  SUPPORTED_LANGUAGES,
  DEFAULT_LOCALE,
  getDictionary,
  getLanguageMeta,
  isSupportedLocale,
  matchBrowserLocale,
} from './index';
import { OPERATOR } from '@/lib/constants';

interface LanguageContextValue {
  locale: Locale;
  dir: Direction;
  currentLanguage: LanguageMeta;
  languages: LanguageMeta[];
  setLocale: (locale: Locale) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  getLocalizedWhatsAppLink: (type?: 'default' | 'tour' | 'transfer' | 'confirmation' | 'faq', data?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

interface LanguageProviderProps {
  initialLocale?: Locale;
  children: React.ReactNode;
}

export function LanguageProvider({ initialLocale, children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || DEFAULT_LOCALE);

  // Sync document attributes on change
  const applyLocaleToDom = useCallback((loc: Locale) => {
    if (typeof document === 'undefined') return;
    const meta = getLanguageMeta(loc);
    document.documentElement.lang = loc;
    document.documentElement.dir = meta.dir;
  }, []);

  // Initialize and check browser language on mount if no cookie was set
  useEffect(() => {
    const savedCookie = getCookie('locale');
    if (savedCookie && isSupportedLocale(savedCookie)) {
      setLocaleState(savedCookie);
      applyLocaleToDom(savedCookie);
      return;
    }

    // Auto-detect from browser
    if (typeof navigator !== 'undefined') {
      const detected = matchBrowserLocale(navigator.language || (navigator.languages && navigator.languages[0]));
      setLocaleState(detected);
      setCookie('locale', detected);
      applyLocaleToDom(detected);
    }
  }, [applyLocaleToDom]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale);
      setCookie('locale', newLocale);
      applyLocaleToDom(newLocale);
    },
    [applyLocaleToDom]
  );

  const meta = useMemo(() => getLanguageMeta(locale), [locale]);
  const dictionary = useMemo(() => getDictionary(locale), [locale]);
  const defaultDictionary = useMemo(() => getDictionary(DEFAULT_LOCALE), []);

  // Translation helper with dot-notation and interpolation
  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split('.');
      
      // Helper to traverse object
      const lookup = (obj: any): any => {
        let current = obj;
        for (const k of keys) {
          if (current && typeof current === 'object' && k in current) {
            current = current[k];
          } else {
            return undefined;
          }
        }
        return current;
      };

      let result = lookup(dictionary);
      if (typeof result !== 'string') {
        result = lookup(defaultDictionary);
      }

      if (typeof result !== 'string') {
        return path; // Fallback to raw key if not found
      }

      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
        });
      }

      return result;
    },
    [dictionary, defaultDictionary]
  );

  // Localized WhatsApp link generator
  const getLocalizedWhatsAppLink = useCallback(
    (type: 'default' | 'tour' | 'transfer' | 'confirmation' | 'faq' = 'default', data?: Record<string, string>): string => {
      const phone = OPERATOR.whatsapp.replace(/[^0-9]/g, '');
      const base = `https://wa.me/${phone}`;
      
      let message = '';
      switch (type) {
        case 'tour':
          message = t('whatsapp.tourInquiry', { title: data?.title || 'Zanzibar Tour' });
          break;
        case 'transfer':
          message = t('whatsapp.transferInquiry', {
            origin: data?.origin || 'Airport',
            destination: data?.destination || 'Hotel',
          });
          break;
        case 'confirmation':
          message = t('whatsapp.bookingConfirmation', {
            reference: data?.reference || '',
            service: data?.service || 'Zanzibar Tour',
            date: data?.date || '',
          });
          break;
        case 'faq':
          message = t('whatsapp.faqQuestion');
          break;
        case 'default':
        default:
          message = t('whatsapp.defaultGreeting');
          break;
      }

      return `${base}?text=${encodeURIComponent(message)}`;
    },
    [t]
  );

  const contextValue = useMemo<LanguageContextValue>(
    () => ({
      locale,
      dir: meta.dir,
      currentLanguage: meta,
      languages: SUPPORTED_LANGUAGES,
      setLocale,
      t,
      getLocalizedWhatsAppLink,
    }),
    [locale, meta, setLocale, t, getLocalizedWhatsAppLink]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
