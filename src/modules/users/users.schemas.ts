import { z } from 'zod';

export const appRoleSchema = z.enum(['jobseeker', 'employer', 'admin']);

export const syncUserSchema = z.object({
  authUserId: z.string().min(1),
  email: z.string().email().optional(),
  displayName: z.string().min(1).max(120).optional(),
  phone: z.string().min(3).max(40).optional(),
  roles: z.array(appRoleSchema).default([]),
});

export type SyncUserInput = z.infer<typeof syncUserSchema>;
