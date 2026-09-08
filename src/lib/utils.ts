import { OPERATOR } from './constants';
import { Locale, DEFAULT_LOCALE, getDictionary } from './i18n';

/**
 * Formats a number as a USD price string (e.g. $160).
 */
export function formatPrice(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * Generates a direct WhatsApp link with an optional prefilled message.
 */
export function getWhatsAppLink(message?: string): string {
  const phone = OPERATOR.whatsapp.replace(/[^0-9]/g, '');
  const base = `https://wa.me/${phone}`;
  if (!message) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates a prefilled WhatsApp link for inquiring or booking a specific tour.
 */
export function getTourWhatsAppLink(tourTitle: string, locale: Locale = DEFAULT_LOCALE): string {
  const dict = getDictionary(locale);
  const message = dict.whatsapp.tourInquiry.replace('{title}', tourTitle);
  return getWhatsAppLink(message);
}

/**
 * Generates a prefilled WhatsApp link for inquiring or booking a transfer between two locations.
 */
export function getTransferWhatsAppLink(origin: string, destination: string, locale: Locale = DEFAULT_LOCALE): string {
  const dict = getDictionary(locale);
  const message = dict.whatsapp.transferInquiry
    .replace('{origin}', origin)
    .replace('{destination}', destination);
  return getWhatsAppLink(message);
}
