import { z } from 'zod';

export const brandingSettingsSchema = z.object({
  companyName: z.string().min(2, 'Company name is required').max(120),
  tagline: z.string().min(2, 'Tagline is required').max(150),
  logoUrl: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
  officialPhone: z.string().min(5, 'Official phone number is required').max(40),
  officialEmail: z.string().email('Valid official email address is required'),
  officialWhatsapp: z.string().min(5, 'Official WhatsApp number is required').max(40),
  registrationNumber: z.string().nullable().optional(),
  traLicenseNumber: z.string().nullable().optional(),
  traLicenseExpiry: z.string().nullable().optional(),
  traLicenseUrl: z.string().nullable().optional(),
  mpesaNumber: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  bankAccount: z.string().nullable().optional(),
  paymentInstructions: z.string().nullable().optional(),
  paymentNotes: z.string().nullable().optional(),
  biography: z.string().nullable().optional(),
  shortBio: z.string().nullable().optional(),
});

export type BrandingSettingsInput = z.infer<typeof brandingSettingsSchema>;
