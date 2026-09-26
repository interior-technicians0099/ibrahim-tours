import { prisma } from '@/lib/prisma';
import { getCompanyProfile } from '@/lib/company';
import { extractPreferredLanguage } from '@/lib/serialization';
import { getLanguageName } from '@/lib/services/email-service';

export interface OperatorContact {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
}

export interface NotifyDraft {
  bookingId: string;
  referenceCode: string;
  message: string;
  operator: OperatorContact;
  whatsappUrl: string;
}

/**
 * Resolves the operator's contact coordinates: booking operator first,
 * then company lead-guide defaults.
 */
export async function resolveOperatorContact(operatorId: string | null): Promise<OperatorContact> {
  const company = await getCompanyProfile().catch(() => null);
  let dbOperator: any = null;
  if (operatorId) {
    dbOperator = await prisma.companyProfile.findUnique({ where: { id: operatorId } }).catch(() => null);
  }

  const clean = (v: unknown, fb: string) => String(v || fb);

  return {
    name: clean(
      dbOperator?.leadGuideName || dbOperator?.companyName || company?.leadGuideName || company?.companyName,
      'Operator'
    ),
    phone: clean(dbOperator?.phone || company?.leadGuidePhone || company?.officialPhone, '+255 618 769 150'),
    whatsapp: clean(
      dbOperator?.leadGuideWhatsApp || dbOperator?.whatsapp || company?.leadGuideWhatsApp || company?.officialWhatsapp,
      '+255 618 769 150'
    ),
    email: clean(dbOperator?.leadGuideEmail || dbOperator?.email || company?.leadGuideEmail, 'info@zansafarihorizon.com'),
  };
}

function formatPax(numAdults: number, numChildren: number): string {
  return `${numAdults} adult${numAdults === 1 ? '' : 's'}${
    numChildren > 0 ? ` + ${numChildren} child${numChildren === 1 ? '' : 'ren'}` : ''
  }`;
}

/**
 * Auto-generates the simple-English operator assignment summary.
 * Super admin edits this text before sending.
 */
export function buildAssignmentMessage(input: {
  referenceCode: string;
  customerName: string;
  customerCountry?: string | null;
  preferredLanguage?: string | null;
  serviceTitle: string;
  bookingDate: string;
  bookingTime?: string | null;
  numAdults: number;
  numChildren: number;
  pickupLocation?: string | null;
}): string {
  const lines = [
    `New tour assignment — ${input.referenceCode}`,
    `Tourist: ${input.customerName} (${input.customerCountry || 'International'})`,
    `Language: ${input.preferredLanguage || 'English'}`,
    `Service: ${input.serviceTitle}`,
    `Date: ${input.bookingDate}${input.bookingTime ? ` at ${input.bookingTime}` : ''}`,
    `Pax: ${formatPax(input.numAdults, input.numChildren)}`,
    `Pickup: ${input.pickupLocation || 'To be confirmed'}`,
    `Ref: ${input.referenceCode}`,
  ];
  return lines.join('\n');
}

/**
 * Loads a booking and builds the editable notify draft for super admin.
 */
export async function buildNotifyDraft(bookingId: string): Promise<NotifyDraft> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { tour: true, route: true, operator: true },
  });
  if (!booking) {
    throw new Error('Booking not found.');
  }

  const operator = await resolveOperatorContact(booking.operatorId);

  const serviceTitle =
    booking.serviceType === 'TOUR'
      ? booking.tour?.title || 'Zanzibar Tour'
      : `${booking.pickupLocation || 'Pickup'} → ${booking.dropoffLocation || 'Drop-off'}`;

  const dateDisplay = new Date(booking.bookingDate).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const preferredLanguage =
    extractPreferredLanguage(booking) || getLanguageName(booking.locale || 'en').split(' ')[0];

  const message = buildAssignmentMessage({
    referenceCode: booking.referenceCode,
    customerName: booking.customerName,
    customerCountry: booking.customerCountry,
    preferredLanguage,
    serviceTitle,
    bookingDate: dateDisplay,
    bookingTime: booking.bookingTime,
    numAdults: booking.numAdults,
    numChildren: booking.numChildren,
    pickupLocation: booking.pickupLocation,
  });

  return {
    bookingId: booking.id,
    referenceCode: booking.referenceCode,
    message,
    operator,
    whatsappUrl: buildOperatorWhatsAppUrl(operator.whatsapp, message),
  };
}

/**
 * wa.me deep link carrying the (possibly edited) assignment message.
 */
export function buildOperatorWhatsAppUrl(operatorPhone: string, message: string): string {
  const cleanPhone = (operatorPhone || '').replace(/[^0-9]/g, '') || '255618769150';
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
