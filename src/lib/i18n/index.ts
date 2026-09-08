import en from './dictionaries/en.json';
import fr from './dictionaries/fr.json';
import es from './dictionaries/es.json';
import it from './dictionaries/it.json';
import de from './dictionaries/de.json';
import ar from './dictionaries/ar.json';
import {
  Locale,
  Dictionary,
  LanguageMeta,
  SUPPORTED_LANGUAGES,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
} from './types';

export * from './types';

export const DICTIONARIES: Record<Locale, Dictionary> = {
  en: en as Dictionary,
  fr: fr as Dictionary,
  es: es as Dictionary,
  it: it as Dictionary,
  de: de as Dictionary,
  ar: ar as Dictionary,
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] || DICTIONARIES[DEFAULT_LOCALE];
}

export function getLanguageMeta(locale: Locale): LanguageMeta {
  const found = SUPPORTED_LANGUAGES.find((lang) => lang.code === locale);
  return found || SUPPORTED_LANGUAGES[0];
}

export function isSupportedLocale(code: string): code is Locale {
  return SUPPORTED_LOCALES.includes(code as Locale);
}

/**
 * Match a raw browser language string (e.g. 'fr-FR', 'ar-EG') to a supported Locale.
 */
export function matchBrowserLocale(languageHeaderOrNavigator?: string): Locale {
  if (!languageHeaderOrNavigator) return DEFAULT_LOCALE;

  const candidate = languageHeaderOrNavigator.toLowerCase().trim();

  // Direct match (e.g. 'fr')
  if (isSupportedLocale(candidate)) {
    return candidate;
  }

  // Prefix match (e.g. 'fr-fr' -> 'fr', 'es-es' -> 'es')
  const prefix = candidate.split(/[-_]/)[0];
  if (isSupportedLocale(prefix)) {
    return prefix;
  }

  return DEFAULT_LOCALE;
}
