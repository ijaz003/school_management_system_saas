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

  const [module] = required.split('.');
  return userPermissions.includes(`${module}.*`);
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
  if (granterPermissions.includes('*')) {
    return { allowed: true, forbidden: [] };
  }

  const forbidden = toGrant.filter(
    (permission) => !hasPermission(granterPermissions, permission),
  );

  return {
    allowed: forbidden.length === 0,
    forbidden,
  };
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
      const module = permission.slice(0, -2);
      allPermissions
        .filter((item) => item.startsWith(`${module}.`))
        .forEach((item) => result.add(item));
    } else {
      result.add(permission);
    }
  }

  return Array.from(result);
}
