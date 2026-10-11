import { useAppSelector } from '@/store/hooks';

export function usePermission() {
  const permissions = useAppSelector(
    (state) => state.auth.user?.permissions ?? [],
  );

  const can = (permission: string): boolean =>
    permissions.some(
      (granted) =>
        granted === '*' ||
        granted === permission ||
        (granted.endsWith('.*') &&
          permission.startsWith(granted.slice(0, -1))),
    );

  return {
    can,
    canAll: (...required: string[]) => required.every(can),
    canAny: (...required: string[]) => required.some(can),
    permissions,
  };
}
