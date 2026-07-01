import { query } from '../../db/query.js';
import type { UpsertJobseekerProfileInput, WorkExperienceInput } from './jobseekers.schemas.js';

export type JobseekerProfileRow = {
  id: string;
  user_id: string;
  public_slug: string;
  headline: string | null;
  bio: string | null;
  status: string;
  verification_status: string;
  country: string | null;
  city: string | null;
  area: string | null;
  preferred_locations: string[];
  years_experience: string;
  expected_pay_min: string | null;
  expected_pay_max: string | null;
  expected_pay_currency: string;
  availability_status: string;
  available_from: string | null;
  work_types: string[];
  show_phone: boolean;
  show_email: boolean;
  last_active_at: Date | null;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type LookupRow = {
  id: string;
  name: string;
  slug: string;
};

export type WorkExperienceRow = {
  id: string;
  profile_id: string;
  title: string;
  employer_name: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  created_at: Date;
  updated_at: Date;
};

export const upsertProfile = async (input: UpsertJobseekerProfileInput, slug: string) => {
  const result = await query<JobseekerProfileRow>(
    `
      insert into jobseeker_profiles (
        user_id,
        public_slug,
        headline,
        bio,
        country,
        city,
        area,
        preferred_locations,
        years_experience,
        expected_pay_min,
        expected_pay_max,
        expected_pay_currency,
        availability_status,
        available_from,
        work_types,
        show_phone,
        show_email,
        last_active_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, now(), now())
      on conflict (user_id) do update set
        headline = excluded.headline,
        bio = excluded.bio,
        country = excluded.country,
        city = excluded.city,
        area = excluded.area,
        preferred_locations = excluded.preferred_locations,
        years_experience = excluded.years_experience,
        expected_pay_min = excluded.expected_pay_min,
        expected_pay_max = excluded.expected_pay_max,
        expected_pay_currency = excluded.expected_pay_currency,
        availability_status = excluded.availability_status,
        available_from = excluded.available_from,
        work_types = excluded.work_types,
        show_phone = excluded.show_phone,
        show_email = excluded.show_email,
        last_active_at = now(),
        updated_at = now()
      returning *
    `,
    [
      input.userId,
      slug,
      input.headline ?? null,
      input.bio ?? null,
      input.country ?? null,
      input.city ?? null,
      input.area ?? null,
      input.preferredLocations,
      input.yearsExperience,
      input.expectedPayMin ?? null,
      input.expectedPayMax ?? null,
      input.expectedPayCurrency.toUpperCase(),
      input.availabilityStatus,
      input.availableFrom ?? null,
      input.workTypes,
      input.showPhone,
      input.showEmail,
    ],
  );

  return result.rows[0];
};

export const replaceProfileRoles = async (profileId: string, roleIds: string[]) => {
  await query('delete from jobseeker_roles where profile_id = $1', [profileId]);

  for (const roleId of roleIds) {
    await query(
      'insert into jobseeker_roles (profile_id, role_category_id) values ($1, $2) on conflict do nothing',
      [profileId, roleId],
    );
  }
};

export const replaceProfileSkills = async (profileId: string, skillIds: string[]) => {
  await query('delete from jobseeker_skills where profile_id = $1', [profileId]);

  for (const skillId of skillIds) {
    await query(
      'insert into jobseeker_skills (profile_id, skill_id) values ($1, $2) on conflict do nothing',
      [profileId, skillId],
    );
  }
};

export const replaceProfileLanguages = async (profileId: string, languageIds: string[]) => {
  await query('delete from jobseeker_languages where profile_id = $1', [profileId]);

  for (const languageId of languageIds) {
    await query(
      'insert into jobseeker_languages (profile_id, language_id) values ($1, $2) on conflict do nothing',
      [profileId, languageId],
    );
  }
};

export const replaceProfileExperiences = async (
  profileId: string,
  experiences: WorkExperienceInput[],
) => {
  await query('delete from work_experiences where profile_id = $1', [profileId]);

  for (const experience of experiences) {
    await query(
      `
        insert into work_experiences (
          profile_id,
          title,
          employer_name,
          location,
          start_date,
          end_date,
          is_current,
          description
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        profileId,
        experience.title,
        experience.employerName ?? null,
        experience.location ?? null,
        experience.startDate ?? null,
        experience.endDate ?? null,
        experience.isCurrent,
        experience.description ?? null,
      ],
    );
  }
};

export const getProfileById = async (profileId: string) => {
  const result = await query<JobseekerProfileRow>(
    'select * from jobseeker_profiles where id = $1',
    [profileId],
  );

  return result.rows[0] ?? null;
};

export const getProfileByUserId = async (userId: string) => {
  const result = await query<JobseekerProfileRow>(
    'select * from jobseeker_profiles where user_id = $1',
    [userId],
  );

  return result.rows[0] ?? null;
};

export const getProfileRoles = async (profileId: string) => {
  const result = await query<LookupRow>(
    `
      select rc.id, rc.name, rc.slug
      from role_categories rc
      inner join jobseeker_roles jr on jr.role_category_id = rc.id
      where jr.profile_id = $1
      order by rc.name
    `,
    [profileId],
  );

  return result.rows;
};

export const getProfileSkills = async (profileId: string) => {
  const result = await query<LookupRow>(
    `
      select s.id, s.name, s.slug
      from skills s
      inner join jobseeker_skills js on js.skill_id = s.id
      where js.profile_id = $1
      order by s.name
    `,
    [profileId],
  );

  return result.rows;
};

export const getProfileLanguages = async (profileId: string) => {
  const result = await query<LookupRow>(
    `
      select l.id, l.name, l.slug
      from languages l
      inner join jobseeker_languages jl on jl.language_id = l.id
      where jl.profile_id = $1
      order by l.name
    `,
    [profileId],
  );

  return result.rows;
};

export const getProfileExperiences = async (profileId: string) => {
  const result = await query<WorkExperienceRow>(
    `
      select *
      from work_experiences
      where profile_id = $1
      order by is_current desc, start_date desc nulls last, created_at desc
    `,
    [profileId],
  );

  return result.rows;
};

export const updateProfileStatus = async (profileId: string, status: string) => {
  const result = await query<JobseekerProfileRow>(
    `
      update jobseeker_profiles
      set
        status = $2,
        published_at = case when $2 = 'active' and published_at is null then now() else published_at end,
        updated_at = now()
      where id = $1
      returning *
    `,
    [profileId, status],
  );

  return result.rows[0] ?? null;
};

export const listRoleCategories = async () => {
  const result = await query<LookupRow>(
    'select id, name, slug from role_categories where is_active = true order by name',
  );
  return result.rows;
};

export const listSkills = async () => {
  const result = await query<LookupRow>('select id, name, slug from skills order by name');
  return result.rows;
};

export const listLanguages = async () => {
  const result = await query<LookupRow>('select id, name, slug from languages order by name');
  return result.rows;
};
