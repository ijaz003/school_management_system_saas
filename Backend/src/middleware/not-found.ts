import type { RequestHandler } from 'express';
import { ApiResponse } from '../lib/response.js';

export const notFound: RequestHandler = (req, res) => {
  return ApiResponse.error(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
  );
};
