import { z } from 'zod';

export const companyWalletParamsSchema = z.object({
  companyId: z.string().uuid(),
});

export const topUpWalletSchema = z.object({
  companyId: z.string().uuid(),
  points: z.coerce.number().int().positive(),
  amountPaid: z.coerce.number().min(0).optional(),
  currency: z.string().length(3).default('KES'),
  paymentReference: z.string().max(160).optional(),
  userId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
});

export const updatePointSettingsSchema = z.object({
  pointValueAmount: z.coerce.number().positive().optional(),
  pointValueCurrency: z.string().length(3).default('KES'),
  candidateRevealCostPoints: z.coerce.number().int().positive().optional(),
});

export type TopUpWalletInput = z.infer<typeof topUpWalletSchema>;
export type UpdatePointSettingsInput = z.infer<typeof updatePointSettingsSchema>;
