export const RESERVED_PERMISSIONS = [
  'platform.*',
  'billing.*',
  'subscription.cancel',
  'settings.school.delete',
  'settings.roles.delete',
  'settings.users.delete',
  'system.backup.restore',
  'system.logs.delete',
] as const;

export function hasPermission(
  userPermissions: string[],
  required: string,
): boolean {
  if (userPermissions.includes('*')) {
    return true;
  }

  if (userPermissions.includes(required)) {
    return true;
  }

  return userPermissions.some(
    (permission) =>
      permission.endsWith('.*') &&
      required.startsWith(permission.slice(0, -1)),
  );
}

export function hasAllPermissions(
  userPermissions: string[],
  required: string[],
): boolean {
  return required.every((permission) =>
    hasPermission(userPermissions, permission),
  );
}

export function hasAnyPermission(
  userPermissions: string[],
  required: string[],
): boolean {
  return required.some((permission) =>
    hasPermission(userPermissions, permission),
  );
}

export function canGrantPermissions(
  granterPermissions: string[],
  toGrant: string[],
): { allowed: boolean; forbidden: string[] } {
  const forbidden = toGrant.filter(
    (permission) =>
      isReservedPermission(permission) ||
      (!granterPermissions.includes('*') &&
        !hasPermission(granterPermissions, permission)),
  );

  return {
    allowed: forbidden.length === 0,
    forbidden,
  };
}

export function isReservedPermission(permission: string): boolean {
  return RESERVED_PERMISSIONS.some((reserved) => {
    if (reserved.endsWith('.*')) {
      const prefix = reserved.slice(0, -1);
      return (
        permission === reserved ||
        permission.startsWith(prefix) ||
        (permission.endsWith('.*') &&
          prefix.startsWith(permission.slice(0, -1)))
      );
    }

    return (
      permission === reserved ||
      (permission.endsWith('.*') &&
        reserved.startsWith(permission.slice(0, -1)))
    );
  });
}

export function expandWildcards(
  permissions: string[],
  allPermissions: string[],
): string[] {
  if (permissions.includes('*')) {
    return allPermissions;
  }

  const result = new Set<string>();

  for (const permission of permissions) {
    if (permission.endsWith('.*')) {
      allPermissions
        .filter((item) => item.startsWith(permission.slice(0, -1)))
        .forEach((item) => result.add(item));
    } else {
      result.add(permission);
    }
  }

  return Array.from(result);
}
