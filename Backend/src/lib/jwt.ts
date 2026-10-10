import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload {
  userId: string;
  tenantId: string | null;
  role: string;
  email: string;
  sessionId?: string;
}

const tokenOptions = {
  issuer: 'school-saas',
  audience: 'school-saas-api',
} as const;

function isJwtPayload(payload: unknown): payload is JwtPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const value = payload as Record<string, unknown>;

  return (
    typeof value.userId === 'string' &&
    (typeof value.tenantId === 'string' || value.tenantId === null) &&
    typeof value.role === 'string' &&
    typeof value.email === 'string' &&
    (value.sessionId === undefined || typeof value.sessionId === 'string')
  );
}

function verifyToken(token: string, secret: string): JwtPayload {
  const payload = jwt.verify(token, secret, tokenOptions);

  if (!isJwtPayload(payload)) {
    throw new jwt.JsonWebTokenError('Invalid token payload');
  }

  return payload;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    ...tokenOptions,
    expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return verifyToken(token, env.JWT_SECRET);
}

export function signRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = {
    ...tokenOptions,
    expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyRefreshToken(token: string): JwtPayload {
  return verifyToken(token, env.JWT_REFRESH_SECRET);
}
