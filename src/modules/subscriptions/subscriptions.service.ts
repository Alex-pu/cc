import { AppError } from '../../shared/http/app-error.js';
import { grantTrialSubscription, listSubscriptionPlans } from './subscriptions.repository.js';
import type { GrantSubscriptionInput } from './subscriptions.schemas.js';

export const getPlans = async () => {
  const rows = await listSubscriptionPlans();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    priceAmount: Number(row.price_amount),
    priceCurrency: row.price_currency,
    billingInterval: row.billing_interval,
    contactUnlockLimit: row.contact_unlock_limit,
    teamMemberLimit: row.team_member_limit,
  }));
};

export const grantTrial = async (input: GrantSubscriptionInput) => {
  const subscription = await grantTrialSubscription(input.companyId, input.planSlug, input.days);

  if (!subscription) {
    throw new AppError('Subscription plan not found', 404, 'PLAN_NOT_FOUND');
  }

  return {
    id: subscription.id,
    companyId: subscription.company_id,
    planId: subscription.plan_id,
    status: subscription.status,
  };
};
