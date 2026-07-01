import type { AppRoute } from '../../shared/http/route-types.js';
import { candidateSearchSchema } from './search.schemas.js';
import { findCandidates } from './search.service.js';

export const searchRoutes: AppRoute = async (app) => {
  app.get('/candidates', async (request) => {
    const input = candidateSearchSchema.parse(request.query);
    return findCandidates(input);
  });
};
