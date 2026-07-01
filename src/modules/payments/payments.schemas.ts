import { z } from 'zod';

export const initializePaystackTopupSchema = z.object({
  companyId: z.string().uuid(),
  points: z.coerce.number().int().positive().max(10000),
  email: z.string().email().optional(),
});

export const verifyPaystackTopupParamsSchema = z.object({
  reference: z.string().min(3).max(160),
});

export type InitializePaystackTopupInput = z.infer<typeof initializePaystackTopupSchema>;
