import type { RequestHandler } from 'express';
import { and, eq, isNull } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { users } from '../modules/auth/auth.schema.js';
import { tenants } from '../modules/tenants/tenants.schema.js';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/jwt.js';

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    let payload;
    try {
      payload = verifyAccessToken(authHeader.slice('Bearer '.length));
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid or expired access token');
      }
      throw error;
    }

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
          eq(users.id, payload.userId),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    if (!result) {
      throw new UnauthorizedError('User not found or inactive');
    }

    const { user } = result;

    if (req.tenantId && req.tenantId !== user.tenantId) {
      throw new ForbiddenError('Request tenant does not match authenticated user');
    }

    if (user.tenantId && (!result.tenantStatus || result.tenantDeletedAt)) {
      throw new UnauthorizedError('School account is unavailable');
    }

    if (
      result.tenantStatus === 'suspended' ||
      result.tenantStatus === 'cancelled'
    ) {
      throw new ForbiddenError('School account is unavailable');
    }

    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      permissions: user.permissions,
    };
    req.tenantId = user.tenantId;

    next();
  } catch (error) {
    next(error);
  }
};
