import type { AppRoute } from '../../shared/http/route-types.js';
import { requireAuth } from '../auth/neon-auth.middleware.js';
import { syncUserSchema } from './users.schemas.js';
import { syncUser } from './users.service.js';

export const usersRoutes: AppRoute = async (app) => {
  app.post('/sync', { preHandler: requireAuth }, async (request, reply) => {
    const input = syncUserSchema.parse({
      ...(request.body ?? {}),
      authUserId: request.authUser?.id,
      email: request.authUser?.email,
    });
    const user = await syncUser(input);
    return reply.status(201).send({ user });
  });

  app.get('/me', { preHandler: requireAuth }, async (request) => ({
    authUser: request.authUser,
  }));
};
