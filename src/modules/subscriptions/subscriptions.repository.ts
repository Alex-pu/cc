import { query } from '../../db/query.js';

export type SubscriptionPlanRow = {
  id: string;
  name: string;
  slug: string;
  price_amount: string;
  price_currency: string;
  billing_interval: string;
  contact_unlock_limit: number;
  team_member_limit: number;
  is_active: boolean;
  created_at: Date;
};

export type EmployerSubscriptionAccessRow = {
  company_id: string;
  subscription_id: string | null;
  status: string | null;
  plan_slug: string | null;
  contact_unlock_limit: number;
  used_unlocks: number;
};

export const listSubscriptionPlans = async () => {
  const result = await query<SubscriptionPlanRow>(
    'select * from subscription_plans where is_active = true order by price_amount asc',
  );

  return result.rows;
};

export const getEmployerSubscriptionAccess = async (companyId: string) => {
  const result = await query<EmployerSubscriptionAccessRow>(
    `
      select
        ec.id as company_id,
        es.id as subscription_id,
        es.status,
        sp.slug as plan_slug,
        coalesce(sp.contact_unlock_limit, 0)::int as contact_unlock_limit,
        count(ccu.id)::int as used_unlocks
      from employer_companies ec
      left join employer_subscriptions es
        on es.company_id = ec.id
        and es.status in ('trialing', 'active')
        and (es.current_period_end is null or es.current_period_end > now())
      left join subscription_plans sp on sp.id = es.plan_id
      left join candidate_contact_unlocks ccu
        on ccu.company_id = ec.id
        and ccu.created_at >= coalesce(es.current_period_start, date_trunc('month', now()))
        and (es.current_period_end is null or ccu.created_at < es.current_period_end)
      where ec.id = $1
      group by ec.id, es.id, es.status, sp.slug, sp.contact_unlock_limit
      order by es.created_at desc nulls last
      limit 1
    `,
    [companyId],
  );

  return result.rows[0] ?? null;
};

export const grantTrialSubscription = async (companyId: string, planSlug: string, days: number) => {
  const result = await query<{ id: string; company_id: string; plan_id: string; status: string }>(
    `
      insert into employer_subscriptions (
        company_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        provider
      )
      select $1, sp.id, 'trialing', now(), now() + ($3::int * interval '1 day'), 'manual'
      from subscription_plans sp
      where sp.slug = $2
      returning id, company_id, plan_id, status
    `,
    [companyId, planSlug, days],
  );

  return result.rows[0] ?? null;
};
