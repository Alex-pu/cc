import { query } from '../../db/query.js';

export type SavedCandidateRow = {
  company_id: string;
  profile_id: string;
  saved_by_user_id: string | null;
  created_at: Date;
  headline: string | null;
  public_slug: string;
  city: string | null;
  area: string | null;
  years_experience: string;
  availability_status: string;
  primary_photo_url: string | null;
};

export const saveCandidate = async (
  companyId: string,
  profileId: string,
  savedByUserId?: string,
) => {
  const result = await query<SavedCandidateRow>(
    `
      insert into saved_candidates (company_id, profile_id, saved_by_user_id)
      values ($1, $2, $3)
      on conflict (company_id, profile_id) do update set saved_by_user_id = excluded.saved_by_user_id
      returning *
    `,
    [companyId, profileId, savedByUserId ?? null],
  );

  return result.rows[0];
};

export const unsaveCandidate = async (companyId: string, profileId: string) => {
  await query('delete from saved_candidates where company_id = $1 and profile_id = $2', [
    companyId,
    profileId,
  ]);
};

export const listSavedCandidates = async (companyId: string) => {
  const result = await query<SavedCandidateRow>(
    `
      select
        sc.company_id,
        sc.profile_id,
        sc.saved_by_user_id,
        sc.created_at,
        jp.headline,
        jp.public_slug,
        jp.city,
        jp.area,
        jp.years_experience,
        jp.availability_status,
        (
          select pp.url
          from profile_photos pp
          where pp.profile_id = jp.id
          order by pp.is_primary desc, pp.created_at desc
          limit 1
        ) as primary_photo_url
      from saved_candidates sc
      inner join jobseeker_profiles jp on jp.id = sc.profile_id
      where sc.company_id = $1
      order by sc.created_at desc
    `,
    [companyId],
  );

  return result.rows;
};

export const hasContactUnlock = async (companyId: string, profileId: string) => {
  const result = await query<{ exists: boolean }>(
    `
      select exists (
        select 1
        from candidate_contact_unlocks
        where company_id = $1
          and profile_id = $2
          and (expires_at is null or expires_at > now())
      )
    `,
    [companyId, profileId],
  );

  return result.rows[0]?.exists ?? false;
};

export const createContactUnlock = async (
  companyId: string,
  profileId: string,
  unlockedByUserId?: string,
  pointsSpent = 0,
  pointTransactionId?: string,
) => {
  const result = await query<{ id: string; created_at: Date }>(
    `
      insert into candidate_contact_unlocks (
        company_id,
        profile_id,
        unlocked_by_user_id,
        points_spent,
        point_transaction_id
      )
      values ($1, $2, $3, $4, $5)
      on conflict (company_id, profile_id) do update set
        unlocked_by_user_id = excluded.unlocked_by_user_id,
        points_spent = candidate_contact_unlocks.points_spent,
        point_transaction_id = coalesce(candidate_contact_unlocks.point_transaction_id, excluded.point_transaction_id)
      returning id, created_at
    `,
    [companyId, profileId, unlockedByUserId ?? null, pointsSpent, pointTransactionId ?? null],
  );

  return result.rows[0];
};

export const recordCandidateView = async (
  companyId: string | null,
  profileId: string,
  viewedByUserId?: string,
) => {
  await query(
    `
      insert into candidate_views (company_id, profile_id, viewed_by_user_id)
      values ($1, $2, $3)
    `,
    [companyId, profileId, viewedByUserId ?? null],
  );
};
