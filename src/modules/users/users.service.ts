import type { SyncUserInput } from './users.schemas.js';
import { getUserRoles, replaceUserRoles, upsertUser } from './users.repository.js';

export const syncUser = async (input: SyncUserInput) => {
  const user = await upsertUser(input);

  if (!user) {
    throw new Error('Failed to sync user');
  }

  await replaceUserRoles(user.id, input.roles);
  const roles = await getUserRoles(user.id);

  return {
    id: user.id,
    authUserId: user.auth_user_id,
    email: user.email,
    displayName: user.display_name,
    phone: user.phone,
    isActive: user.is_active,
    roles,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
};
