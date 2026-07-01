import type { AppRoute } from '../../shared/http/route-types.js';
import { requireAuth } from '../auth/neon-auth.middleware.js';
import {
  assertPaystackWebhookSignature,
  creditPaystackTopup,
  initializePaystackTopup,
  verifyAndCreditPaystackTopup,
} from './payments.service.js';
import { initializePaystackTopupSchema, verifyPaystackTopupParamsSchema } from './payments.schemas.js';

export const paymentsRoutes: AppRoute = async (app) => {
  app.post('/paystack/topups/initialize', { preHandler: requireAuth }, async (request, reply) => {
    const input = initializePaystackTopupSchema.parse(request.body);
    const payment = await initializePaystackTopup(input, request.authUser);
    return reply.status(201).send({ payment });
  });

  app.post('/paystack/topups/:reference/verify', { preHandler: requireAuth }, async (request) => {
    const params = verifyPaystackTopupParamsSchema.parse(request.params);
    const result = await verifyAndCreditPaystackTopup(params.reference);
    return { result };
  });

  app.post('/paystack/webhook', async (request) => {
    assertPaystackWebhookSignature(request.body, request.headers['x-paystack-signature']);

    const event = request.body as {
      event?: string;
      data?: Parameters<typeof creditPaystackTopup>[0];
    };

    if (event.event === 'charge.success' && event.data) {
      await creditPaystackTopup(event.data);
    }

    return { received: true };
  });
};
