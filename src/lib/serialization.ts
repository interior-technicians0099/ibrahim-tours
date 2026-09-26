/**
 * Serialization Layer for Data Exposure Hardening.
 * Guarantees that internal financial figures (cost, margins, platform commission shares)
 * are NEVER leaked into public API responses or unauthenticated client components.
 */

export interface PublicBookingDTO {
  id: string;
  referenceCode: string;
  serviceType: string;
  tier: string | null;
  serviceTitle?: string;
  bookingDate: string;
  bookingTime: string | null;
  numAdults: number;
  numChildren: number;
  status: string;
  paymentStatus: string;
  totalPriceCents: number;
  quotedPriceCents: number;
  amountPaidCents: number;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCountry: string | null;
  specialRequests: string | null;
  createdAt: string;
  tour?: any;
  transportService?: any;
  route?: any;
}

/**
 * Transforms a raw Prisma Booking record into a sanitized public DTO.
 * Explicitly strips internal costs, profit margins, and platform commission fields.
 */
export function toPublicBookingDto(booking: any): PublicBookingDTO {
  if (!booking) return null as any;

  return {
    id: booking.id,
    referenceCode: booking.referenceCode,
    serviceType: booking.serviceType,
    tier: booking.tier || null,
    serviceTitle:
      booking.serviceType === 'TOUR'
        ? booking.tour?.title || 'Zanzibar Excursion'
        : `${booking.pickupLocation || 'Pickup'} → ${booking.dropoffLocation || 'Drop-off'}`,
    bookingDate:
      booking.bookingDate instanceof Date
        ? booking.bookingDate.toISOString()
        : String(booking.bookingDate || ''),
    bookingTime: booking.bookingTime || null,
    numAdults: booking.numAdults,
    numChildren: booking.numChildren,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    totalPriceCents: Number(booking.totalPriceCents || booking.quotedPriceCents || 0),
    quotedPriceCents: Number(booking.quotedPriceCents || booking.totalPriceCents || 0),
    amountPaidCents: Number(booking.amountPaidCents || 0),
    pickupLocation: booking.pickupLocation || null,
    dropoffLocation: booking.dropoffLocation || null,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    customerCountry: booking.customerCountry || null,
    specialRequests: booking.specialRequests || null,
    createdAt:
      booking.createdAt instanceof Date
        ? booking.createdAt.toISOString()
        : String(booking.createdAt || ''),
    tour: booking.tour ? { id: booking.tour.id, title: booking.tour.title, slug: booking.tour.slug } : undefined,
    transportService: booking.transportService
      ? { id: booking.transportService.id, vehicleType: booking.transportService.vehicleType }
      : undefined,
    route: booking.route ? { id: booking.route.id, name: booking.route.name } : undefined,
  };
}

/**
 * P1 — Operator-facing booking shape. STRICT service-details-only whitelist:
 * service, date, time, pax, pickup, tourist name/phone/country/preferred
 * language, special requests, status. NO amounts, NO payment state, NO
 * financials, NO tourist email, NO internal notes.
 */
export interface OperatorBookingDTO {
  id: string;
  referenceCode: string;
  serviceType: string;
  serviceTitle: string;
  bookingDate: string;
  bookingTime: string | null;
  numAdults: number;
  numChildren: number;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  customerName: string;
  customerPhone: string;
  customerCountry: string | null;
  preferredLanguage: string | null;
  locale: string | null;
  specialRequests: string | null;
  status: string;
  guideName: string | null;
  guidePhone: string | null;
  notifiedAt: string | null;
  unreadInbox: boolean;
}

const OPERATOR_FINANCIAL_KEYS = [
  'quotedPriceCents',
  'totalPriceCents',
  'amountPaidCents',
  'costCents',
  'profitCents',
  'commissionRate',
  'commissionAmountCents',
  'commissionStatus',
  'costOverrideNotes',
  'paymentStatus',
  'paymentMethod',
  'paymentDate',
  'paymentReference',
  'operatorNotes',
  'payments',
  'receipt',
] as const;

/**
 * Transforms a raw Prisma Booking into the operator-safe DTO.
 * Throws nothing; unknown shapes degrade to nulls rather than leaking.
 */
export function toOperatorBookingDto(booking: any): OperatorBookingDTO {
  if (!booking) return null as any;
  return {
    id: booking.id,
    referenceCode: booking.referenceCode,
    serviceType: booking.serviceType,
    serviceTitle:
      booking.serviceType === 'TOUR'
        ? booking.tour?.title || 'Zanzibar Excursion'
        : `${booking.pickupLocation || 'Pickup'} → ${booking.dropoffLocation || 'Drop-off'}`,
    bookingDate:
      booking.bookingDate instanceof Date
        ? booking.bookingDate.toISOString()
        : String(booking.bookingDate || ''),
    bookingTime: booking.bookingTime || null,
    numAdults: booking.numAdults ?? 1,
    numChildren: booking.numChildren ?? 0,
    pickupLocation: booking.pickupLocation || null,
    dropoffLocation: booking.dropoffLocation || null,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerCountry: booking.customerCountry || null,
    preferredLanguage: extractPreferredLanguage(booking),
    locale: booking.locale || null,
    specialRequests: booking.specialRequests || null,
    status: booking.status,
    guideName: booking.guideName || null,
    guidePhone: booking.guidePhone || null,
    notifiedAt:
      booking.inboxMessages?.[0]?.sentAt instanceof Date
        ? booking.inboxMessages[0].sentAt.toISOString()
        : booking.inboxMessages?.[0]?.sentAt
          ? String(booking.inboxMessages[0].sentAt)
          : null,
    unreadInbox: Array.isArray(booking.inboxMessages)
      ? booking.inboxMessages.some((m: any) => !m.readAt)
      : false,
  };
}

/**
 * Preferred guide language recorded at booking time
 * (stored as "Preferred Guide Language: X" inside guideNotes).
 */
export function extractPreferredLanguage(booking: any): string | null {
  const hay = `${booking?.guideNotes || ''}\n${booking?.specialRequests || ''}`;
  const match = hay.match(/preferred guide language:\s*([^\]\n]+)/i);
  if (match) return match[1].trim();
  return booking?.locale || null;
}

/**
 * Runtime assertion for tests and API boundaries: fails if ANY financial
 * key (or nested payments/receipt payloads) is present on the object.
 * Returns the list of leaked key paths (empty = clean).
 */
export function findFinancialLeaks(obj: any, path = '$'): string[] {
  const leaks: string[] = [];
  if (!obj || typeof obj !== 'object') return leaks;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => leaks.push(...findFinancialLeaks(item, `${path}[${i}]`)));
    return leaks;
  }
  for (const key of Object.keys(obj)) {
    if ((OPERATOR_FINANCIAL_KEYS as readonly string[]).includes(key)) {
      leaks.push(`${path}.${key}`);
    }
    if (obj[key] && typeof obj[key] === 'object') {
      leaks.push(...findFinancialLeaks(obj[key], `${path}.${key}`));
    }
  }
  return leaks;
}

/**
 * Strips confidential financial keys from any object or array of objects.
 */
export function stripPrivateFinancials<T extends Record<string, any>>(obj: T): Omit<T, 'costCents' | 'profitCents' | 'commissionRate' | 'commissionAmountCents' | 'commissionStatus'> {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => stripPrivateFinancials(item)) as any;
  }

  const sanitized = { ...obj };
  delete sanitized.costCents;
  delete sanitized.profitCents;
  delete sanitized.commissionRate;
  delete sanitized.commissionAmountCents;
  delete sanitized.commissionStatus;
  delete sanitized.operatorNotes;

  return sanitized;
}
