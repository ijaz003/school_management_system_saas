import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../lib/errors.js';
import { ApiResponse } from '../lib/response.js';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode);
  }

  if (err instanceof ZodError) {
    return ApiResponse.error(
      res,
      'Validation failed',
      400,
      err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }

  if (
    err instanceof SyntaxError &&
    'type' in err &&
    err.type === 'entity.parse.failed'
  ) {
    return ApiResponse.error(res, 'Invalid JSON request body', 400);
  }

  if (
    err instanceof Error &&
    (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
  ) {
    return ApiResponse.error(
      res,
      err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
      401,
    );
  }

  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = err.code;

    switch (code) {
      case '23505':
        return ApiResponse.error(res, 'Duplicate entry', 409);
      case '23503':
        return ApiResponse.error(res, 'Referenced record not found', 409);
      case '23502':
        return ApiResponse.error(res, 'Required field missing', 400);
      case '22P02':
        return ApiResponse.error(res, 'Invalid input format', 400);
    }
  }

  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');

  return ApiResponse.error(
    res,
    env.NODE_ENV === 'development' && err instanceof Error
      ? err.message
      : 'Internal server error',
    500,
  );
};
