import { query } from '../../db/query.js';
import type { SyncUserInput } from './users.schemas.js';

export type AppUserRow = {
  id: string;
  auth_user_id: string;
  email: string | null;
  display_name: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export const upsertUser = async (input: SyncUserInput) => {
  const result = await query<AppUserRow>(
    `
      insert into app_users (auth_user_id, email, display_name, phone, last_seen_at, updated_at)
      values ($1, $2, $3, $4, now(), now())
      on conflict (auth_user_id) do update set
        email = coalesce(excluded.email, app_users.email),
        display_name = coalesce(excluded.display_name, app_users.display_name),
        phone = coalesce(excluded.phone, app_users.phone),
        last_seen_at = now(),
        updated_at = now()
      returning *
    `,
    [input.authUserId, input.email ?? null, input.displayName ?? null, input.phone ?? null],
  );

  return result.rows[0];
};

export const replaceUserRoles = async (userId: string, roles: SyncUserInput['roles']) => {
  if (!roles.length) {
    return;
  }

  await query('delete from user_roles where user_id = $1', [userId]);

  for (const role of roles) {
    await query('insert into user_roles (user_id, role) values ($1, $2)', [userId, role]);
  }
};

export const getUserById = async (id: string) => {
  const result = await query<AppUserRow>('select * from app_users where id = $1', [id]);
  return result.rows[0] ?? null;
};

export const getUserRoles = async (userId: string) => {
  const result = await query<{ role: string }>(
    'select role from user_roles where user_id = $1 order by role',
    [userId],
  );

  return result.rows.map((row) => row.role);
};
