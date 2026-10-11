import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import { ApiResponse } from '../../lib/response.js';
import { UnauthorizedError } from '../../lib/errors.js';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshUserToken,
} from './auth.service.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await loginUser({
      email: req.body.email,
      password: req.body.password,
      tenantSlug: req.body.tenantSlug,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return ApiResponse.success(
      res,
      {
        accessToken: result.accessToken,
        user: result.user,
      },
      'Login successful',
    );
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken =
      req.cookies?.refreshToken ?? req.body?.refreshToken;

    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      throw new UnauthorizedError('No refresh token provided');
    }

    const result = await refreshUserToken(refreshToken);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return ApiResponse.success(
      res,
      { accessToken: result.accessToken },
      'Token refreshed',
    );
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if (typeof refreshToken === 'string') {
      await logoutUser(refreshToken);
    }

    res.clearCookie('refreshToken', {
      httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
      secure: REFRESH_COOKIE_OPTIONS.secure,
      sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
      path: REFRESH_COOKIE_OPTIONS.path,
    });

    return ApiResponse.success(res, null, 'Logout successful');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const user = await getCurrentUser(req.user.id);
    return ApiResponse.success(res, user, 'User fetched');
  }),
};
