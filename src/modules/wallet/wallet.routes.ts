import type { AppRoute } from '../../shared/http/route-types.js';
import { requireAuth, requireRole } from '../auth/neon-auth.middleware.js';
import {
  companyWalletParamsSchema,
  topUpWalletSchema,
  updatePointSettingsSchema,
} from './wallet.schemas.js';
import {
  getCompanyWallet,
  getWalletSettings,
  setWalletSettings,
  topUpCompanyWallet,
} from './wallet.service.js';

export const walletRoutes: AppRoute = async (app) => {
  app.get('/settings', async () => getWalletSettings());

  app.patch('/settings', { preHandler: [requireAuth, requireRole('admin')] }, async (request) => {
    const input = updatePointSettingsSchema.parse(request.body);
    return setWalletSettings(input);
  });

  app.get('/companies/:companyId', { preHandler: requireAuth }, async (request) => {
    const params = companyWalletParamsSchema.parse(request.params);
    return getCompanyWallet(params.companyId);
  });

  app.post('/topups', { preHandler: [requireAuth, requireRole('admin')] }, async (request, reply) => {
    const input = topUpWalletSchema.parse(request.body);
    const topup = await topUpCompanyWallet(input);
    return reply.status(201).send(topup);
  });
};
