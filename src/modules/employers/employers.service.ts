import { withRandomSuffix } from '../../shared/utils/slugify.js';
import type { EmployerProfileRow } from './employers.repository.js';
import {
  addEmployerMember,
  createEmployerProfile,
  listEmployerProfilesByUser,
} from './employers.repository.js';
import type { CreateHiringProfileInput } from './employers.schemas.js';

const toEmployerProfile = (row: EmployerProfileRow) => ({
  id: row.id,
  accountType: row.account_type,
  displayName: row.name,
  slug: row.slug,
  contactName: row.contact_name,
  website: row.website,
  phone: row.phone,
  email: row.email,
  country: row.country,
  city: row.city,
  area: row.area,
  description: row.description,
  hiringContext: row.hiring_context,
  verificationStatus: row.verification_status,
  isActive: row.is_active,
  createdByUserId: row.created_by_user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createHiringProfile = async (input: CreateHiringProfileInput) => {
  const row = await createEmployerProfile(input, withRandomSuffix(input.displayName));

  if (!row) {
    throw new Error('Failed to create hiring profile');
  }

  await addEmployerMember(row.id, input.userId);
  return toEmployerProfile(row);
};

export const listHiringProfilesByUser = async (userId: string) => {
  const rows = await listEmployerProfilesByUser(userId);
  return rows.map(toEmployerProfile);
};
