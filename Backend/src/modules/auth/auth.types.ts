import type { User } from './auth.schema.js';

export interface LoginInput {
  email: string;
  password: string;
  tenantSlug?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

export interface RefreshOutput {
  accessToken: string;
  refreshToken: string;
}

export type SafeUser = Omit<
  User,
  'passwordHash' | 'twoFactorSecret' | 'resetToken' | 'resetTokenExpiry'
>;

export function toSafeUser(user: User): SafeUser {
  const {
    passwordHash: _passwordHash,
    twoFactorSecret: _twoFactorSecret,
    resetToken: _resetToken,
    resetTokenExpiry: _resetTokenExpiry,
    ...safeUser
  } = user;

  void [_passwordHash, _twoFactorSecret, _resetToken, _resetTokenExpiry];
  return safeUser;
}

export interface CreateSuperAdminInput {
  email: string;
  password: string;
  fullName: string;
}
