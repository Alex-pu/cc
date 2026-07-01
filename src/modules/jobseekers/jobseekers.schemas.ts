import { z } from 'zod';

export const availabilityStatusSchema = z.enum([
  'immediate',
  'one_week',
  'two_weeks',
  'date_specific',
  'not_available',
]);

export const workTypeSchema = z.enum([
  'full_time',
  'part_time',
  'contract',
  'casual',
  'temporary',
  'internship',
  'live_in',
]);

export const workExperienceInputSchema = z.object({
  title: z.string().min(2).max(120),
  employerName: z.string().min(2).max(160).optional(),
  location: z.string().max(160).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(1000).optional(),
});

export const upsertJobseekerProfileSchema = z.object({
  userId: z.string().uuid(),
  headline: z.string().min(3).max(160).optional(),
  bio: z.string().max(1200).optional(),
  country: z.string().min(2).max(80).optional(),
  city: z.string().min(2).max(80).optional(),
  area: z.string().min(2).max(120).optional(),
  preferredLocations: z.array(z.string().min(2).max(120)).default([]),
  yearsExperience: z.coerce.number().min(0).max(80).default(0),
  expectedPayMin: z.coerce.number().min(0).optional(),
  expectedPayMax: z.coerce.number().min(0).optional(),
  expectedPayCurrency: z.string().length(3).default('KES'),
  availabilityStatus: availabilityStatusSchema.default('immediate'),
  availableFrom: z.string().date().optional(),
  workTypes: z.array(workTypeSchema).default([]),
  showPhone: z.boolean().default(false),
  showEmail: z.boolean().default(false),
  roleIds: z.array(z.string().uuid()).default([]),
  skillIds: z.array(z.string().uuid()).default([]),
  languageIds: z.array(z.string().uuid()).default([]),
  experiences: z.array(workExperienceInputSchema).default([]),
});

export const updateProfileStatusSchema = z.object({
  status: z.enum(['draft', 'pending_review', 'active', 'paused']),
});

export type UpsertJobseekerProfileInput = z.infer<typeof upsertJobseekerProfileSchema>;
export type WorkExperienceInput = z.infer<typeof workExperienceInputSchema>;
export type UpdateProfileStatusInput = z.infer<typeof updateProfileStatusSchema>;
