import { query } from '../../db/query.js';
import type { CreateHiringProfileInput } from './employers.schemas.js';

export type EmployerProfileRow = {
  id: string;
  account_type: 'individual' | 'business';
  name: string;
  slug: string;
  contact_name: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  area: string | null;
  description: string | null;
  hiring_context: string | null;
  verification_status: string;
  is_active: boolean;
  created_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export const createEmployerProfile = async (input: CreateHiringProfileInput, slug: string) => {
  const result = await query<EmployerProfileRow>(
    `
      insert into employer_companies (
        account_type,
        name,
        slug,
        contact_name,
        website,
        phone,
        email,
        country,
        city,
        area,
        description,
        hiring_context,
        created_by_user_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      returning *
    `,
    [
      input.accountType,
      input.displayName,
      slug,
      input.contactName ?? null,
      input.website ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.country ?? null,
      input.city ?? null,
      input.area ?? null,
      input.description ?? null,
      input.hiringContext ?? null,
      input.userId,
    ],
  );

  return result.rows[0];
};

export const addEmployerMember = async (companyId: string, userId: string, memberRole = 'owner') => {
  await query(
    `
      insert into employer_members (company_id, user_id, member_role)
      values ($1, $2, $3)
      on conflict (company_id, user_id) do update set member_role = excluded.member_role
    `,
    [companyId, userId, memberRole],
  );
};

export const listEmployerProfilesByUser = async (userId: string) => {
  const result = await query<EmployerProfileRow>(
    `
      select ec.*
      from employer_companies ec
      inner join employer_members em on em.company_id = ec.id
      where em.user_id = $1
      order by ec.created_at desc
    `,
    [userId],
  );

  return result.rows;
};
