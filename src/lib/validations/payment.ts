import { z } from 'zod';
import { PaymentMethod, BookingStatus } from '@prisma/client';

export const recordPaymentSchema = z.object({
  amountPaidCents: z.coerce
    .number()
    .int('Amount in cents must be an integer')
    .positive('Payment amount must be greater than zero')
    .max(100_000_000, 'Amount cannot exceed $1,000,000'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentDate: z.string().optional().or(z.date()),
  paymentReference: z.string().max(100, 'Payment reference cannot exceed 100 characters').optional().nullable(),
  operatorNotes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional().nullable(),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional().nullable(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  reason: z.string().max(1000, 'Reason cannot exceed 1000 characters').optional().nullable(),
  operatorNotes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional().nullable(),
});

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
