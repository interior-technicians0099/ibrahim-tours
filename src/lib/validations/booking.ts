import { z } from 'zod';

const BaseBookingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(5, 'Phone number must be at least 5 digits')
    .max(30, 'Phone number is too long'),
  country: z.string().trim().optional().default('United Kingdom'),
  specialRequests: z.string().trim().max(1000, 'Special requests cannot exceed 1000 characters').optional().default(''),
  locale: z.enum(['en', 'fr', 'es', 'it', 'de', 'ar']).optional().default('en'),
  tier: z.string().optional(),
  honeypot: z.string().optional().default(''),
});

export const TourBookingSchema = BaseBookingSchema.extend({
  serviceType: z.literal('TOUR'),
  tourSlug: z.string().min(1, 'Tour selection is required'),
  tourDate: z.string().min(1, 'Please choose a tour date'),
  tourTime: z.string().optional().default('08:30 AM'),
  numAdults: z.coerce.number().int().min(1, 'At least 1 adult is required').default(2),
  numChildren: z.coerce.number().int().min(0).default(0),
  pickupLocation: z.string().trim().min(1, 'Pickup location is required'),
});

export const TransportBookingSchema = BaseBookingSchema.extend({
  serviceType: z.literal('TRANSPORT'),
  routeId: z.string().min(1, 'Transfer route is required'),
  transportDate: z.string().min(1, 'Please choose a transfer date'),
  transportTime: z.string().optional().default('12:00 PM'),
  passengers: z.coerce.number().int().min(1, 'At least 1 passenger is required').default(2),
  luggageCount: z.string().optional().default('2 Bags'),
  pickupLocation: z.string().trim().min(1, 'Pickup location is required'),
  dropoffLocation: z.string().trim().min(1, 'Drop-off location is required'),
});

export const BookingPayloadSchema = z.discriminatedUnion('serviceType', [
  TourBookingSchema,
  TransportBookingSchema,
]);

export type TourBookingPayload = z.infer<typeof TourBookingSchema>;
export type TransportBookingPayload = z.infer<typeof TransportBookingSchema>;
export type BookingPayload = z.infer<typeof BookingPayloadSchema>;
