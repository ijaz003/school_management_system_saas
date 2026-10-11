import type { RequestHandler } from 'express';
import { and, eq, isNull } from 'drizzle-orm';
import { env } from '../config/env.js';
import { db } from '../config/database.js';
import { ApiResponse } from '../lib/response.js';
import { tenants } from '../modules/tenants/tenants.schema.js';

const RESERVED_SUBDOMAINS = new Set(['www', 'admin', 'api']);

function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .split(':')[0];
}

function getSubdomain(host: string, rootDomain: string): string | null {
  if (!rootDomain || host === rootDomain || !host.endsWith(`.${rootDomain}`)) {
    return null;
  }

  const subdomain = host.slice(0, -(rootDomain.length + 1));

  return subdomain && !subdomain.includes('.') ? subdomain : null;
}

export const resolveTenant: RequestHandler = async (req, res, next) => {
  try {
    const host = normalizeDomain(req.hostname);
    const rootDomain = normalizeDomain(env.ROOT_DOMAIN);
    const isLocalHost =
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host === '127.0.0.1' ||
      host.endsWith('.127.0.0.1');

    const tenantHeader = req.get('x-tenant');
    const subdomain = isLocalHost
      ? tenantHeader?.trim().toLowerCase() || null
      : getSubdomain(host, rootDomain);

    req.tenantId = null;
    req.tenant = undefined;

    if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
      return next();
    }

    if (!/^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/.test(subdomain)) {
      return ApiResponse.error(res, 'Invalid school subdomain', 400);
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(
        and(
          eq(tenants.slug, subdomain),
          isNull(tenants.deletedAt),
        ),
      )
      .limit(1);

    if (!tenant) {
      return ApiResponse.error(res, 'School not found', 404);
    }

    if (tenant.status === 'suspended') {
      return ApiResponse.error(
        res,
        'School account is suspended. Contact support.',
        403,
      );
    }

    if (tenant.status === 'cancelled') {
      return ApiResponse.error(res, 'School account is cancelled.', 403);
    }

    req.tenantId = tenant.id;
    req.tenant = tenant;
    return next();
  } catch (error) {
    return next(error);
  }
};
