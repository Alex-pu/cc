import type { AppRoute } from '../../shared/http/route-types.js';
import { grantSubscriptionSchema } from './subscriptions.schemas.js';
import { getPlans, grantTrial } from './subscriptions.service.js';

export const subscriptionsRoutes: AppRoute = async (app) => {
  app.get('/plans', async () => ({
    items: await getPlans(),
  }));

  app.post('/grant-trial', async (request, reply) => {
    const input = grantSubscriptionSchema.parse(request.body);
    const subscription = await grantTrial(input);
    return reply.status(201).send({ subscription });
  });
};
