import { z } from 'zod';

export const grantSubscriptionSchema = z.object({
  companyId: z.string().uuid(),
  planSlug: z.string().min(1).default('business'),
  days: z.coerce.number().int().positive().max(366).default(30),
});

export type GrantSubscriptionInput = z.infer<typeof grantSubscriptionSchema>;
