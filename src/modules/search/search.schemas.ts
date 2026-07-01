import { z } from 'zod';

export const candidateSearchSchema = z.object({
  q: z.string().max(120).optional(),
  roleId: z.string().uuid().optional(),
  skillId: z.string().uuid().optional(),
  country: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  area: z.string().max(120).optional(),
  availabilityStatus: z
    .enum(['immediate', 'one_week', 'two_weeks', 'date_specific', 'not_available'])
    .optional(),
  workType: z
    .enum(['full_time', 'part_time', 'contract', 'casual', 'temporary', 'internship', 'live_in'])
    .optional(),
  verifiedOnly: z.coerce.boolean().default(false),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CandidateSearchInput = z.infer<typeof candidateSearchSchema>;
