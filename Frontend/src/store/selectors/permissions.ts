import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

const selectUserPermissions = (state: RootState) =>
  state.auth.user?.permissions ?? [];

export const selectCan = (permission: string) =>
  createSelector([selectUserPermissions], (permissions) =>
    permissions.some(
      (granted) =>
        granted === '*' ||
        granted === permission ||
        (granted.endsWith('.*') &&
          permission.startsWith(granted.slice(0, -1))),
    ),
  );

export const selectIsSuperAdmin = (state: RootState) =>
  state.auth.user?.permissions.includes('*') ?? false;

export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectInitialized = (state: RootState) => state.auth.initialized;
