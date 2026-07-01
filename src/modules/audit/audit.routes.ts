import type { AppRoute } from '../../shared/http/route-types.js';

export const auditRoutes: AppRoute = async (app) => {
  app.get('/events', async () => ({
    items: [],
    message: 'Audit events endpoint placeholder',
  }));
};
