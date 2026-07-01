import { z } from 'zod';

export const companyCandidateParamsSchema = z.object({
  companyId: z.string().uuid(),
  profileId: z.string().uuid(),
});

export const companyParamsSchema = z.object({
  companyId: z.string().uuid(),
});

export const userActionSchema = z.object({
  userId: z.string().uuid().optional(),
});

export type CompanyCandidateParams = z.infer<typeof companyCandidateParamsSchema>;
export type CompanyParams = z.infer<typeof companyParamsSchema>;
export type UserActionInput = z.infer<typeof userActionSchema>;
