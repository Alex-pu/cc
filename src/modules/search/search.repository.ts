import { query } from '../../db/query.js';
import type { CandidateSearchInput } from './search.schemas.js';

export type CandidateSearchRow = {
  id: string;
  public_slug: string;
  headline: string | null;
  bio: string | null;
  status: string;
  verification_status: string;
  country: string | null;
  city: string | null;
  area: string | null;
  years_experience: string;
  expected_pay_min: string | null;
  expected_pay_max: string | null;
  expected_pay_currency: string;
  availability_status: string;
  work_types: string[];
  last_active_at: Date | null;
  roles: string[];
  skills: string[];
  primary_photo_url: string | null;
  total_count: string;
};

export const searchCandidates = async (input: CandidateSearchInput) => {
  const conditions = [`jp.status = 'active'`];
  const params: unknown[] = [];

  const addParam = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (input.q) {
    const placeholder = addParam(input.q);
    conditions.push(
      `to_tsvector('english', coalesce(jp.headline, '') || ' ' || coalesce(jp.bio, '') || ' ' || coalesce(jp.city, '') || ' ' || coalesce(jp.area, '')) @@ plainto_tsquery('english', ${placeholder})`,
    );
  }

  if (input.roleId) {
    conditions.push(
      `exists (
        select 1 from jobseeker_roles jr
        where jr.profile_id = jp.id and jr.role_category_id = ${addParam(input.roleId)}
      )`,
    );
  }

  if (input.skillId) {
    conditions.push(
      `exists (
        select 1 from jobseeker_skills js
        where js.profile_id = jp.id and js.skill_id = ${addParam(input.skillId)}
      )`,
    );
  }

  if (input.country) {
    conditions.push(`jp.country ilike ${addParam(input.country)}`);
  }

  if (input.city) {
    conditions.push(`jp.city ilike ${addParam(input.city)}`);
  }

  if (input.area) {
    conditions.push(`jp.area ilike ${addParam(input.area)}`);
  }

  if (input.availabilityStatus) {
    conditions.push(`jp.availability_status = ${addParam(input.availabilityStatus)}`);
  }

  if (input.workType) {
    conditions.push(`${addParam(input.workType)} = any(jp.work_types)`);
  }

  if (input.verifiedOnly) {
    conditions.push(`jp.verification_status = 'verified'`);
  }

  const limit = addParam(input.pageSize);
  const offset = addParam((input.page - 1) * input.pageSize);

  const result = await query<CandidateSearchRow>(
    `
      select
        jp.id,
        jp.public_slug,
        jp.headline,
        jp.bio,
        jp.status,
        jp.verification_status,
        jp.country,
        jp.city,
        jp.area,
        jp.years_experience,
        jp.expected_pay_min,
        jp.expected_pay_max,
        jp.expected_pay_currency,
        jp.availability_status,
        jp.work_types,
        jp.last_active_at,
        coalesce(array_remove(array_agg(distinct rc.name), null), '{}') as roles,
        coalesce(array_remove(array_agg(distinct s.name), null), '{}') as skills,
        (
          select pp.url
          from profile_photos pp
          where pp.profile_id = jp.id
          order by pp.is_primary desc, pp.created_at desc
          limit 1
        ) as primary_photo_url,
        count(*) over() as total_count
      from jobseeker_profiles jp
      left join jobseeker_roles jr on jr.profile_id = jp.id
      left join role_categories rc on rc.id = jr.role_category_id
      left join jobseeker_skills js on js.profile_id = jp.id
      left join skills s on s.id = js.skill_id
      where ${conditions.join(' and ')}
      group by jp.id
      order by jp.last_active_at desc nulls last, jp.updated_at desc
      limit ${limit}
      offset ${offset}
    `,
    params,
  );

  return result.rows;
};
