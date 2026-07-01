import type { AppRoute } from '../../shared/http/route-types.js';
import {
  companyCandidateParamsSchema,
  companyParamsSchema,
  userActionSchema,
} from './candidate-workflow.schemas.js';
import {
  getCandidateForEmployer,
  getSavedCandidatesForCompany,
  saveCandidateForCompany,
  unlockCandidateContact,
  unsaveCandidateForCompany,
} from './candidate-workflow.service.js';
import { createHiringProfileSchema } from './employers.schemas.js';
import { createHiringProfile, listHiringProfilesByUser } from './employers.service.js';

export const employersRoutes: AppRoute = async (app) => {
  app.post('/hiring-profiles', async (request, reply) => {
    const input = createHiringProfileSchema.parse(request.body);
    const hiringProfile = await createHiringProfile(input);
    return reply.status(201).send({ hiringProfile });
  });

  app.get('/hiring-profiles', async (request) => {
    const query = request.query as { userId?: string };

    if (!query.userId) {
      return {
        items: [],
        message: 'Pass userId until Neon Auth request identity is wired.',
      };
    }

    const items = await listHiringProfilesByUser(query.userId);
    return { items };
  });

  app.get('/hiring-profiles/:companyId/saved-candidates', async (request) => {
    const params = companyParamsSchema.parse(request.params);
    const items = await getSavedCandidatesForCompany(params.companyId);
    return { items };
  });

  app.put('/hiring-profiles/:companyId/saved-candidates/:profileId', async (request) => {
    const params = companyCandidateParamsSchema.parse(request.params);
    const input = userActionSchema.parse(request.body ?? {});
    return saveCandidateForCompany(params.companyId, params.profileId, input.userId);
  });

  app.delete('/hiring-profiles/:companyId/saved-candidates/:profileId', async (request) => {
    const params = companyCandidateParamsSchema.parse(request.params);
    return unsaveCandidateForCompany(params.companyId, params.profileId);
  });

  app.get('/hiring-profiles/:companyId/candidates/:profileId', async (request) => {
    const params = companyCandidateParamsSchema.parse(request.params);
    const query = userActionSchema.parse(request.query);
    const candidate = await getCandidateForEmployer(params.companyId, params.profileId, query.userId);
    return { candidate };
  });

  app.post('/hiring-profiles/:companyId/candidates/:profileId/unlock-contact', async (request) => {
    const params = companyCandidateParamsSchema.parse(request.params);
    const input = userActionSchema.parse(request.body ?? {});
    return unlockCandidateContact(params.companyId, params.profileId, input.userId);
  });
};
