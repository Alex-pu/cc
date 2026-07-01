import type { FastifyPluginAsync } from 'fastify';

import { adminRoutes } from './admin/admin.routes.js';
import { auditRoutes } from './audit/audit.routes.js';
import { authRoutes } from './auth/auth.routes.js';
import { employersRoutes } from './employers/employers.routes.js';
import { filesRoutes } from './files/files.routes.js';
import { jobseekersRoutes } from './jobseekers/jobseekers.routes.js';
import { notificationsRoutes } from './notifications/notifications.routes.js';
import { paymentsRoutes } from './payments/payments.routes.js';
import { searchRoutes } from './search/search.routes.js';
import { subscriptionsRoutes } from './subscriptions/subscriptions.routes.js';
import { usersRoutes } from './users/users.routes.js';
import { walletRoutes } from './wallet/wallet.routes.js';

export const registerRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => ({
    ok: true,
    version: 'v1',
  }));

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(usersRoutes, { prefix: '/users' });
  await app.register(jobseekersRoutes, { prefix: '/jobseekers' });
  await app.register(employersRoutes, { prefix: '/employers' });
  await app.register(searchRoutes, { prefix: '/search' });
  await app.register(subscriptionsRoutes, { prefix: '/subscriptions' });
  await app.register(walletRoutes, { prefix: '/wallet' });
  await app.register(filesRoutes, { prefix: '/files' });
  await app.register(paymentsRoutes, { prefix: '/payments' });
  await app.register(notificationsRoutes, { prefix: '/notifications' });
  await app.register(adminRoutes, { prefix: '/admin' });
  await app.register(auditRoutes, { prefix: '/audit' });
};
