import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url(),
  NEON_AUTH_URL: z.string().url(),
  NEON_AUTH_JWKS_URL: z.string().url().optional(),
  NEON_AUTH_JWT_ISSUER: z.string().optional(),
  NEON_AUTH_JWT_AUDIENCE: z.string().optional(),
  ADMIN_CONTACT_PHONE: z.string().default('0704813341'),
  PAYMENTS_ENABLED: z
    .string()
    .default('false')
    .transform((value) => value.toLowerCase() === 'true'),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_CURRENCY: z.string().length(3).default('KES'),
  PAYSTACK_CALLBACK_URL: z.string().url().optional(),
  CLOUDINARY_URL: z.string().startsWith('cloudinary://').optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default('staffmarket'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim())),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export const env = envSchema.parse(process.env);

export type Env = typeof env;
