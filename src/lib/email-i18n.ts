import { getDictionary, isSupportedLocale, DEFAULT_LOCALE, Locale } from '@/lib/i18n';
import { logger } from '@/lib/logger';

export { getDictionary, isSupportedLocale, DEFAULT_LOCALE };
export type { Locale };

/**
 * Resolves a booking locale to a supported email Locale.
 * Warns when booking.locale is missing/unsupported (falls back to 'en')
 * so locale plumbing regressions are visible in logs.
 */
export function resolveEmailLocale(rawLocale: string | null | undefined): Locale {
  if (!rawLocale) {
    console.warn("[EmailService] booking.locale is missing — falling back to 'en'.");
    return DEFAULT_LOCALE;
  }
  if (!isSupportedLocale(rawLocale)) {
    console.warn(`[EmailService] Unsupported booking.locale "${rawLocale}" — falling back to 'en'.`);
    return DEFAULT_LOCALE;
  }
  return rawLocale;
}

/**
 * Interpolates {token} placeholders (replaceAll semantics via g-flag regex,
 * mirroring the client-side t() helper). Unknown tokens are left untouched
 * so the dev guard below can catch them.
 */
export function fillTemplate(template: string, vars: Record<string, string | number | null | undefined>): string {
  let out = template;
  for (const [key, val] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val ?? ''));
  }
  return out;
}

/**
 * Dev guard: flags unreplaced {placeholder} tokens in a fully-rendered email
 * body. Throws in development, logs in production, so template bugs like the
 * literal "{name}" greeting can never ship silently again.
 * Returns the list of leftover tokens (empty = clean).
 */
export function assertNoPlaceholders(html: string, context: string): string[] {
  const leftovers = Array.from(html.matchAll(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g)).map((m) => m[0]);
  const suspicious = [...new Set(leftovers)].filter((t) => !/^\{\d/.test(t));
  if (suspicious.length > 0) {
    const msg = `[EmailService] Unreplaced placeholders in ${context}: ${suspicious.join(', ')}`;
    if (process.env.NODE_ENV === 'development') {
      throw new Error(msg);
    }
    logger.error(msg, { context });
  }
  return suspicious;
}
