import type { AppRoute } from '../../shared/http/route-types.js';
import { updateProfileStatusSchema, upsertJobseekerProfileSchema } from './jobseekers.schemas.js';
import {
  getFullJobseekerProfile,
  getJobseekerLookups,
  getMyJobseekerProfile,
  setJobseekerProfileStatus,
  upsertJobseekerProfile,
} from './jobseekers.service.js';

export const jobseekersRoutes: AppRoute = async (app) => {
  app.get('/lookups', async () => getJobseekerLookups());

  app.get('/me', async (request) => {
    const query = request.query as { userId?: string };

    if (!query.userId) {
      return {
        profile: null,
        message: 'Pass userId until Neon Auth request identity is wired.',
      };
    }

    const profile = await getMyJobseekerProfile(query.userId);
    return { profile };
  });

  app.put('/me', async (request, reply) => {
    const input = upsertJobseekerProfileSchema.parse(request.body);
    const profile = await upsertJobseekerProfile(input);
    return reply.status(200).send({ profile });
  });

  app.patch('/:id/status', async (request) => {
    const params = request.params as { id: string };
    const input = updateProfileStatusSchema.parse(request.body);
    const profile = await setJobseekerProfileStatus(params.id, input);
    return { profile };
  });

  app.get('/:id', async (request) => {
    const params = request.params as { id: string };
    const profile = await getFullJobseekerProfile(params.id);
    return { profile };
  });
};
