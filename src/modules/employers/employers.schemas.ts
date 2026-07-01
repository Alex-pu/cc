import { z } from 'zod';

export const employerAccountTypeSchema = z.enum(['individual', 'business']);

export const createHiringProfileSchema = z.object({
  userId: z.string().uuid(),
  accountType: employerAccountTypeSchema.default('business'),
  displayName: z.string().min(2).max(160),
  contactName: z.string().min(2).max(120).optional(),
  phone: z.string().min(3).max(40).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  country: z.string().min(2).max(80).optional(),
  city: z.string().min(2).max(80).optional(),
  area: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional(),
  hiringContext: z.string().max(1000).optional(),
});

export type CreateHiringProfileInput = z.infer<typeof createHiringProfileSchema>;
