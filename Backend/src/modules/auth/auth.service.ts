import { createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type JwtPayload,
} from '../../lib/jwt.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../lib/errors.js';
import { refreshTokens, users } from './auth.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import type {
  CreateSuperAdminInput,
  LoginInput,
  LoginOutput,
  RefreshOutput,
  SafeUser,
} from './auth.types.js';
import { toSafeUser } from './auth.types.js';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getRefreshTokenExpiry(token: string): Date {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded === 'string' || typeof decoded.exp !== 'number') {
    throw new Error('Signed refresh token is missing its expiry');
  }

  return new Date(decoded.exp * 1000);
}

function createTokenPayload(user: typeof users.$inferSelect): JwtPayload {
  return {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
    sessionId: randomUUID(),
  };
}

export async function loginUser(input: LoginInput): Promise<LoginOutput> {
  const email = input.email.toLowerCase();
  const tenantSlug = input.tenantSlug?.toLowerCase();

  const [result] = await db
    .select({
      user: users,
      tenantStatus: tenants.status,
      tenantDeletedAt: tenants.deletedAt,
    })
    .from(users)
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .where(
      and(
        eq(users.email, email),
        eq(users.isActive, true),
        isNull(users.deletedAt),
        tenantSlug ? eq(tenants.slug, tenantSlug) : isNull(users.tenantId),
      ),
    )
    .limit(1);

  if (!result) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const { user } = result;

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new UnauthorizedError(
      `Account locked. Try again after ${user.lockedUntil.toLocaleTimeString()}`,
    );
  }

  if (!(await verifyPassword(user.passwordHash, input.password))) {
    await handleFailedLogin(user.id, user.failedLoginAttempts);
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.tenantId) {
    if (!result.tenantStatus || result.tenantDeletedAt) {
      throw new NotFoundError('School');
    }

    if (result.tenantStatus === 'suspended') {
      throw new ForbiddenError('School account is suspended');
    }

    if (result.tenantStatus === 'cancelled') {
      throw new ForbiddenError('School account has been cancelled');
    }
  }

  if (user.twoFactorEnabled) {
    throw new ForbiddenError(
      'Two-factor authentication is enabled but is not yet supported for login',
    );
  }

  const payload = createTokenPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await db.transaction(async (tx) => {
    await tx.insert(refreshTokens).values({
      userId: user.id,
      token: hashRefreshToken(refreshToken),
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      expiresAt: getRefreshTokenExpiry(refreshToken),
    });

    await tx
      .update(users)
      .set({
        lastLoginAt: new Date(),
        lastLoginIp: input.ipAddress,
        failedLoginAttempts: '0',
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  });

  return {
    accessToken,
    refreshToken,
    user: toSafeUser(user),
  };
}

export async function refreshUserToken(
  oldRefreshToken: string,
): Promise<RefreshOutput> {
  let payload: JwtPayload;

  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  return db.transaction(async (tx) => {
    const [storedToken] = await tx
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, hashRefreshToken(oldRefreshToken)),
          eq(refreshTokens.userId, payload.userId),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!storedToken) {
      throw new UnauthorizedError('Refresh token revoked or expired');
    }

    const [user] = await tx
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, payload.userId),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    if (!user) {
      throw new UnauthorizedError('User account is inactive');
    }

    if (user.tenantId) {
      const [tenant] = await tx
        .select({
          status: tenants.status,
          deletedAt: tenants.deletedAt,
        })
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

      if (!tenant || tenant.deletedAt) {
        throw new UnauthorizedError('School account is unavailable');
      }

      if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
        throw new ForbiddenError('School account is unavailable');
      }
    }

    const [revokedToken] = await tx
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.id, storedToken.id),
          isNull(refreshTokens.revokedAt),
        ),
      )
      .returning({ id: refreshTokens.id });

    if (!revokedToken) {
      throw new UnauthorizedError('Refresh token has already been used');
    }

    const newPayload = createTokenPayload(user);
    const accessToken = signAccessToken(newPayload);
    const refreshToken = signRefreshToken(newPayload);

    await tx.insert(refreshTokens).values({
      userId: user.id,
      token: hashRefreshToken(refreshToken),
      expiresAt: getRefreshTokenExpiry(refreshToken),
    });

    return { accessToken, refreshToken };
  });
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshTokens.token, hashRefreshToken(refreshToken)),
        isNull(refreshTokens.revokedAt),
      ),
    );
}

export async function getCurrentUser(userId: string): Promise<SafeUser> {
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        eq(users.isActive, true),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);

  if (!user) {
    throw new NotFoundError('User');
  }

  return toSafeUser(user);
}

export async function createSuperAdmin(
  input: CreateSuperAdminInput,
): Promise<SafeUser> {
  const email = input.email.trim().toLowerCase();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), isNull(users.tenantId)))
    .limit(1);

  if (existing) {
    throw new ConflictError('Super admin email is already registered');
  }

  const passwordHash = await hashPassword(input.password);
  const [user] = await db
    .insert(users)
    .values({
      tenantId: null,
      email,
      passwordHash,
      fullName: input.fullName.trim(),
      role: 'super_admin',
      permissions: ['*'],
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    })
    .returning();

  if (!user) {
    throw new Error('Failed to create super admin');
  }

  return toSafeUser(user);
}

async function handleFailedLogin(
  userId: string,
  currentAttempts: string,
): Promise<void> {
  const attempts = Number.parseInt(currentAttempts, 10) + 1;

  await db
    .update(users)
    .set({
      failedLoginAttempts: String(attempts),
      lockedUntil:
        attempts >= MAX_LOGIN_ATTEMPTS
          ? new Date(Date.now() + LOCK_DURATION_MS)
          : null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
