import type { RequestHandler } from 'express';
import { ApiResponse } from '../lib/response.js';
import { hasAllPermissions, hasPermission } from '../lib/permissions.js';

export function can(...requiredPermissions: string[]): RequestHandler {
  if (requiredPermissions.length === 0) {
    throw new TypeError('can() requires at least one permission');
  }

  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    if (
      req.user.permissions.includes('*') ||
      requiredPermissions.every((permission) =>
        hasPermission(req.user!.permissions, permission),
      )
    ) {
      return next();
    }

    return ApiResponse.error(res, 'Insufficient permissions', 403, [
      {
        path: 'permissions',
        message: `Required: ${requiredPermissions.join(', ')}`,
      },
    ]);
  };
}

export function canAny(...requiredPermissions: string[]): RequestHandler {
  if (requiredPermissions.length === 0) {
    throw new TypeError('canAny() requires at least one permission');
  }

  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    if (
      req.user.permissions.includes('*') ||
      requiredPermissions.some((permission) =>
        hasPermission(req.user!.permissions, permission),
      )
    ) {
      return next();
    }

    return ApiResponse.error(res, 'Insufficient permissions', 403, [
      {
        path: 'permissions',
        message: `Requires one of: ${requiredPermissions.join(', ')}`,
      },
    ]);
  };
}

export function requireRole(...roles: string[]): RequestHandler {
  if (roles.length === 0) {
    throw new TypeError('requireRole() requires at least one role');
  }

  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    if (req.user.role === 'super_admin' || roles.includes(req.user.role)) {
      return next();
    }

    return ApiResponse.error(res, 'Access denied — insufficient role', 403, [
      {
        path: 'role',
        message: `Required role: ${roles.join(' or ')}`,
      },
    ]);
  };
}

export function requireRoleOrPermission(
  roles: readonly string[],
  permissions: readonly string[],
): RequestHandler {
  if (roles.length === 0 && permissions.length === 0) {
    throw new TypeError('requireRoleOrPermission() requires at least one role or permission');
  }

  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    if (
      req.user.role === 'super_admin' ||
      roles.includes(req.user.role) ||
      (permissions.length > 0 &&
        hasAllPermissions(req.user.permissions, [...permissions]))
    ) {
      return next();
    }

    return ApiResponse.error(
      res,
      'Access denied — insufficient role or permissions',
      403,
      [{
        path: 'access',
        message: `Required role: ${roles.join(' or ') || 'none'} OR permissions: ${permissions.join(', ') || 'none'}`,
      }],
    );
  };
}

export function requireSuperAdmin(): RequestHandler {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    if (req.user.role !== 'super_admin') {
      return ApiResponse.error(res, 'Super admin access required', 403);
    }

    return next();
  };
}
