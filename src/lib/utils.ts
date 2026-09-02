import { OPERATOR } from './constants';

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
export function getTourWhatsAppLink(tourTitle: string): string {
  const message = `Hello Ibrahim! I am interested in booking the "${tourTitle}" tour with Ibrahim Tours Zanzibar. Could you please let me know availability and details?`;
  return getWhatsAppLink(message);
}

/**
 * Generates a prefilled WhatsApp link for inquiring or booking a transfer between two locations.
 */
export function getTransferWhatsAppLink(origin: string, destination: string): string {
  const message = `Hello Ibrahim! I would like to book a private transfer from ${origin} to ${destination}. Could you please confirm availability and vehicle options?`;
  return getWhatsAppLink(message);
}
