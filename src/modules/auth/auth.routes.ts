import type { AppRoute } from '../../shared/http/route-types.js';
import { requireAuth } from './neon-auth.middleware.js';

export const authRoutes: AppRoute = async (app) => {
  app.get('/session', { preHandler: requireAuth }, async (request) => ({
    authenticated: true,
    provider: 'neon-auth',
    user: request.authUser,
  }));
};
