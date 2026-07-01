import type { AppRoute } from '../../shared/http/route-types.js';

export const notificationsRoutes: AppRoute = async (app) => {
  app.get('/', async () => ({
    items: [],
    message: 'Notifications endpoint placeholder',
  }));
};
