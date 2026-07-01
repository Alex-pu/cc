import type { AppRoute } from '../../shared/http/route-types.js';

export const adminRoutes: AppRoute = async (app) => {
  app.get('/overview', async () => ({
    message: 'Admin overview endpoint placeholder',
  }));
};
