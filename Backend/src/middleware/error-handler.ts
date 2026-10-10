import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../lib/errors.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
    return;
  }

  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(env.NODE_ENV === 'development' && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
};
