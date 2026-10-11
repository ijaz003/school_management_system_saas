import type { RequestHandler } from 'express';
import { logger } from '../config/logger.js';

export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const logData = {
      method: req.method,
      url: `${req.baseUrl}${req.path}`,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'Request failed');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Request warning');
    } else {
      logger.info(logData, 'Request completed');
    }
  });

  next();
};
