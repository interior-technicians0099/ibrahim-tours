import { z } from 'zod';

export const contactInputSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(150, 'Email cannot exceed 150 characters')
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .min(5, 'Phone number must be at least 5 digits')
    .max(30, 'Phone number cannot exceed 30 digits')
    .trim(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message cannot exceed 2000 characters')
    .trim(),
  consent: z.boolean().optional(),
  honeypot: z.string().max(0, 'Spam detected').optional().or(z.literal('')),
});

export type ContactInput = z.infer<typeof contactInputSchema>;
