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
