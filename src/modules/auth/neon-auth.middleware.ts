import type { FastifyReply, FastifyRequest } from 'fastify';
import crypto from 'node:crypto';

import { env } from '../../config/env.js';
import { AppError } from '../../shared/http/app-error.js';

export type AuthenticatedUser = {
  id: string;
  email?: string;
  roles: string[];
};

type Jwk = JsonWebKey & {
  kid?: string;
  alg?: string;
};

type JwtClaims = {
  sub?: string;
  email?: string;
  exp?: number;
  nbf?: number;
  iss?: string;
  aud?: string | string[];
  roles?: string[];
  app_metadata?: {
    roles?: string[];
  };
};

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthenticatedUser;
  }
}

let jwksCache: { keys: Jwk[]; expiresAt: number } | null = null;

const base64UrlDecode = (value: string) =>
  Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

const getJwks = async () => {
  if (!env.NEON_AUTH_JWKS_URL) {
    throw new AppError('NEON_AUTH_JWKS_URL is required for Neon Auth JWT verification', 500, 'AUTH_NOT_CONFIGURED');
  }

  if (jwksCache && jwksCache.expiresAt > Date.now()) {
    return jwksCache.keys;
  }

  const response = await fetch(env.NEON_AUTH_JWKS_URL);

  if (!response.ok) {
    throw new AppError('Could not load Neon Auth signing keys', 503, 'AUTH_KEYS_UNAVAILABLE');
  }

  const body = (await response.json()) as { keys?: Jwk[] };
  jwksCache = {
    keys: body.keys ?? [],
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  return jwksCache.keys;
};

const parseJwt = (token: string) => {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new AppError('Invalid authentication token', 401, 'AUTH_INVALID_TOKEN');
  }

  const header = JSON.parse(base64UrlDecode(encodedHeader)) as { kid?: string; alg?: string };
  const claims = JSON.parse(base64UrlDecode(encodedPayload)) as JwtClaims;

  return {
    header,
    claims,
    signingInput: `${encodedHeader}.${encodedPayload}`,
    signature: encodedSignature,
  };
};

const assertExpectedClaims = (claims: JwtClaims) => {
  const now = Math.floor(Date.now() / 1000);

  if (!claims.sub) {
    throw new AppError('Authentication token is missing subject', 401, 'AUTH_INVALID_TOKEN');
  }

  if (claims.exp && claims.exp <= now) {
    throw new AppError('Authentication token has expired', 401, 'AUTH_TOKEN_EXPIRED');
  }

  if (claims.nbf && claims.nbf > now) {
    throw new AppError('Authentication token is not active yet', 401, 'AUTH_TOKEN_NOT_ACTIVE');
  }

  if (env.NEON_AUTH_JWT_ISSUER && claims.iss !== env.NEON_AUTH_JWT_ISSUER) {
    throw new AppError('Authentication token issuer is invalid', 401, 'AUTH_INVALID_ISSUER');
  }

  if (env.NEON_AUTH_JWT_AUDIENCE) {
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud].filter(Boolean);

    if (!audiences.includes(env.NEON_AUTH_JWT_AUDIENCE)) {
      throw new AppError('Authentication token audience is invalid', 401, 'AUTH_INVALID_AUDIENCE');
    }
  }
};

const verifyJwt = async (token: string) => {
  const jwt = parseJwt(token);
  const jwks = await getJwks();
  const jwk = jwks.find((key) => key.kid === jwt.header.kid) ?? jwks[0];

  if (!jwk) {
    throw new AppError('No Neon Auth signing key is available', 503, 'AUTH_KEYS_UNAVAILABLE');
  }

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const signature = Buffer.from(jwt.signature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const verified = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    signature,
    Buffer.from(jwt.signingInput),
  );

  if (!verified) {
    throw new AppError('Authentication token signature is invalid', 401, 'AUTH_INVALID_SIGNATURE');
  }

  assertExpectedClaims(jwt.claims);
  return jwt.claims;
};

const getRoles = (claims: JwtClaims) => claims.roles ?? claims.app_metadata?.roles ?? [];

export const requireAuth = async (request: FastifyRequest, _reply: FastifyReply) => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const claims = await verifyJwt(authorization.slice('Bearer '.length));
  request.authUser = {
    id: claims.sub!,
    ...(claims.email ? { email: claims.email } : {}),
    roles: getRoles(claims),
  };
};

export const requireRole =
  (role: string) => async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.authUser?.roles.includes(role)) {
      throw new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN');
    }
  };
