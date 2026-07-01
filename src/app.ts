import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';

import { env } from './config/env.js';
import { registerRoutes } from './modules/routes.js';
import { errorHandler } from './shared/http/error-handler.js';

export const buildApp = async () => {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  app.setErrorHandler(errorHandler);

  app.get('/health', async () => ({
    ok: true,
    service: 'hospitality-talent-backend',
  }));

  await app.register(registerRoutes, { prefix: '/api/v1' });

  return app;
};
