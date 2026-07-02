import { createInternalNeonAuth } from '@neondatabase/auth';

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL || '';

const neonAuth = neonAuthUrl ? createInternalNeonAuth(neonAuthUrl) : null;

export const authClient = neonAuth?.adapter ?? null;

export const getAuthToken = async () => neonAuth?.getJWTToken() ?? null;

export const isAuthConfigured = Boolean(neonAuth);
