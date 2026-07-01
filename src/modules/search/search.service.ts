import { searchCandidates } from './search.repository.js';
import type { CandidateSearchInput } from './search.schemas.js';

export const findCandidates = async (input: CandidateSearchInput) => {
  const rows = await searchCandidates(input);
  const total = rows[0]?.total_count ? Number(rows[0].total_count) : 0;

  return {
    items: rows.map((row) => ({
      id: row.id,
      publicSlug: row.public_slug,
      headline: row.headline,
      bio: row.bio,
      status: row.status,
      verificationStatus: row.verification_status,
      country: row.country,
      city: row.city,
      area: row.area,
      yearsExperience: Number(row.years_experience),
      expectedPayMin: row.expected_pay_min === null ? null : Number(row.expected_pay_min),
      expectedPayMax: row.expected_pay_max === null ? null : Number(row.expected_pay_max),
      expectedPayCurrency: row.expected_pay_currency,
      availabilityStatus: row.availability_status,
      workTypes: row.work_types,
      roles: row.roles,
      skills: row.skills,
      primaryPhotoUrl: row.primary_photo_url,
      lastActiveAt: row.last_active_at,
    })),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
    },
  };
};
