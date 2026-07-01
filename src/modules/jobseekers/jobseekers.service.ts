import { withRandomSuffix } from '../../shared/utils/slugify.js';
import { AppError } from '../../shared/http/app-error.js';
import type { JobseekerProfileRow, WorkExperienceRow } from './jobseekers.repository.js';
import {
  getProfileById,
  getProfileByUserId,
  getProfileExperiences,
  getProfileLanguages,
  getProfileRoles,
  getProfileSkills,
  listLanguages,
  listRoleCategories,
  listSkills,
  replaceProfileExperiences,
  replaceProfileLanguages,
  replaceProfileRoles,
  replaceProfileSkills,
  updateProfileStatus,
  upsertProfile,
} from './jobseekers.repository.js';
import type { UpdateProfileStatusInput, UpsertJobseekerProfileInput } from './jobseekers.schemas.js';

const toExperience = (row: WorkExperienceRow) => ({
  id: row.id,
  title: row.title,
  employerName: row.employer_name,
  location: row.location,
  startDate: row.start_date,
  endDate: row.end_date,
  isCurrent: row.is_current,
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toProfileBase = (row: JobseekerProfileRow) => ({
  id: row.id,
  userId: row.user_id,
  publicSlug: row.public_slug,
  headline: row.headline,
  bio: row.bio,
  status: row.status,
  verificationStatus: row.verification_status,
  country: row.country,
  city: row.city,
  area: row.area,
  preferredLocations: row.preferred_locations,
  yearsExperience: Number(row.years_experience),
  expectedPayMin: row.expected_pay_min === null ? null : Number(row.expected_pay_min),
  expectedPayMax: row.expected_pay_max === null ? null : Number(row.expected_pay_max),
  expectedPayCurrency: row.expected_pay_currency,
  availabilityStatus: row.availability_status,
  availableFrom: row.available_from,
  workTypes: row.work_types,
  showPhone: row.show_phone,
  showEmail: row.show_email,
  lastActiveAt: row.last_active_at,
  publishedAt: row.published_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getFullJobseekerProfile = async (profileId: string) => {
  const row = await getProfileById(profileId);

  if (!row) {
    throw new AppError('Jobseeker profile not found', 404, 'PROFILE_NOT_FOUND');
  }

  const [roles, skills, languages, experiences] = await Promise.all([
    getProfileRoles(profileId),
    getProfileSkills(profileId),
    getProfileLanguages(profileId),
    getProfileExperiences(profileId),
  ]);

  return {
    ...toProfileBase(row),
    roles,
    skills,
    languages,
    experiences: experiences.map(toExperience),
  };
};

export const getMyJobseekerProfile = async (userId: string) => {
  const row = await getProfileByUserId(userId);

  if (!row) {
    return null;
  }

  return getFullJobseekerProfile(row.id);
};

export const upsertJobseekerProfile = async (input: UpsertJobseekerProfileInput) => {
  const existing = await getProfileByUserId(input.userId);
  const slugSeed = input.headline || input.city || 'candidate';
  const row = await upsertProfile(input, existing?.public_slug ?? withRandomSuffix(slugSeed));

  if (!row) {
    throw new Error('Failed to save jobseeker profile');
  }

  await Promise.all([
    replaceProfileRoles(row.id, input.roleIds),
    replaceProfileSkills(row.id, input.skillIds),
    replaceProfileLanguages(row.id, input.languageIds),
    replaceProfileExperiences(row.id, input.experiences),
  ]);

  return getFullJobseekerProfile(row.id);
};

export const setJobseekerProfileStatus = async (
  profileId: string,
  input: UpdateProfileStatusInput,
) => {
  const row = await updateProfileStatus(profileId, input.status);

  if (!row) {
    throw new AppError('Jobseeker profile not found', 404, 'PROFILE_NOT_FOUND');
  }

  return getFullJobseekerProfile(row.id);
};

export const getJobseekerLookups = async () => {
  const [roles, skills, languages] = await Promise.all([
    listRoleCategories(),
    listSkills(),
    listLanguages(),
  ]);

  return { roles, skills, languages };
};
