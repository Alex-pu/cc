import type { AppRoute } from '../../shared/http/route-types.js';
import crypto from 'node:crypto';
import { z } from 'zod';

import { env } from '../../config/env.js';
import { AppError } from '../../shared/http/app-error.js';
import { requireAuth } from '../auth/neon-auth.middleware.js';

const uploadUrlRequestSchema = z.object({
  folder: z.string().min(1).max(120).optional(),
  publicId: z.string().min(1).max(160).optional(),
});

const getCloudinaryConfig = () => {
  if (env.CLOUDINARY_URL) {
    const url = new URL(env.CLOUDINARY_URL);

    return {
      cloudName: url.hostname,
      apiKey: decodeURIComponent(url.username),
      apiSecret: decodeURIComponent(url.password),
    };
  }

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  };
};

export const filesRoutes: AppRoute = async (app) => {
  app.post('/upload-url', { preHandler: requireAuth }, async (request) => {
    const input = uploadUrlRequestSchema.parse(request.body ?? {});
    const cloudinary = getCloudinaryConfig();

    if (!cloudinary.cloudName || !cloudinary.apiKey || !cloudinary.apiSecret) {
      throw new AppError(
        'Cloudinary is not configured. Add CLOUDINARY_URL or the separate Cloudinary credentials.',
        503,
        'CLOUDINARY_NOT_CONFIGURED',
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = input.folder ?? env.CLOUDINARY_UPLOAD_FOLDER;
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };

    if (input.publicId) {
      paramsToSign.public_id = input.publicId;
    }

    const signatureBase = Object.entries(paramsToSign)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(`${signatureBase}${cloudinary.apiSecret}`)
      .digest('hex');

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`,
      cloudName: cloudinary.cloudName,
      apiKey: cloudinary.apiKey,
      folder,
      timestamp,
      signature,
      ...(input.publicId ? { publicId: input.publicId } : {}),
    };
  });
};
