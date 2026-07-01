import { AppError } from '../../shared/http/app-error.js';
import { env } from '../../config/env.js';
import { getFullJobseekerProfile } from '../jobseekers/jobseekers.service.js';
import { getUserById } from '../users/users.repository.js';
import { getPointSettings, spendWalletPoints } from '../wallet/wallet.repository.js';
import {
  createContactUnlock,
  hasContactUnlock,
  listSavedCandidates,
  recordCandidateView,
  saveCandidate,
  unsaveCandidate,
} from './candidate-workflow.repository.js';

export const saveCandidateForCompany = async (
  companyId: string,
  profileId: string,
  userId?: string,
) => {
  await saveCandidate(companyId, profileId, userId);
  return { saved: true };
};

export const unsaveCandidateForCompany = async (companyId: string, profileId: string) => {
  await unsaveCandidate(companyId, profileId);
  return { saved: false };
};

export const getSavedCandidatesForCompany = async (companyId: string) => {
  const rows = await listSavedCandidates(companyId);

  return rows.map((row) => ({
    companyId: row.company_id,
    profileId: row.profile_id,
    savedByUserId: row.saved_by_user_id,
    savedAt: row.created_at,
    headline: row.headline,
    publicSlug: row.public_slug,
    city: row.city,
    area: row.area,
    yearsExperience: Number(row.years_experience),
    availabilityStatus: row.availability_status,
    primaryPhotoUrl: row.primary_photo_url,
  }));
};

export const unlockCandidateContact = async (
  companyId: string,
  profileId: string,
  userId?: string,
) => {
  if (!env.PAYMENTS_ENABLED) {
    throw new AppError(
      `Payments and direct candidate contact are coming soon. Please contact admin on ${env.ADMIN_CONTACT_PHONE}.`,
      503,
      'PAYMENTS_COMING_SOON',
    );
  }

  const alreadyUnlocked = await hasContactUnlock(companyId, profileId);

  if (alreadyUnlocked) {
    return {
      unlocked: true,
      reusedExistingUnlock: true,
    };
  }

  const settings = await getPointSettings();
  const revealCost = settings.candidateRevealCost.points;
  const spend = await spendWalletPoints({
    companyId,
    profileId,
    points: revealCost,
    note: 'Candidate contact reveal',
    ...(userId ? { userId } : {}),
  });

  if (!spend?.wallet || !spend.transaction) {
    throw new AppError('Not enough points to reveal this candidate profile', 402, 'INSUFFICIENT_POINTS');
  }

  const unlock = await createContactUnlock(
    companyId,
    profileId,
    userId,
    revealCost,
    spend.transaction.id,
  );

  return {
    unlocked: true,
    reusedExistingUnlock: false,
    unlockId: unlock?.id,
    unlockedAt: unlock?.created_at,
    pointsSpent: revealCost,
    remainingPoints: spend.wallet.balance_points,
  };
};

export const getCandidateForEmployer = async (
  companyId: string,
  profileId: string,
  userId?: string,
) => {
  await recordCandidateView(companyId, profileId, userId);
  const [profile, contactUnlocked] = await Promise.all([
    getFullJobseekerProfile(profileId),
    hasContactUnlock(companyId, profileId),
  ]);
  const profileUser = contactUnlocked ? await getUserById(profile.userId) : null;
  const settings = contactUnlocked ? null : await getPointSettings();

  return {
    ...profile,
    contactAccess: {
      unlocked: contactUnlocked,
      unlockCostPoints: env.PAYMENTS_ENABLED && !contactUnlocked ? settings?.candidateRevealCost.points : 0,
      paymentsEnabled: env.PAYMENTS_ENABLED,
      adminContactPhone: env.ADMIN_CONTACT_PHONE,
    },
    contact: contactUnlocked
      ? {
          email: profileUser?.email ?? null,
          phone: profileUser?.phone ?? null,
          publicEmailVisible: profile.showEmail,
          publicPhoneVisible: profile.showPhone,
        }
      : null,
  };
};
