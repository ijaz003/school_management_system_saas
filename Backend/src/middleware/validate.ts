import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ApiResponse } from '../lib/response.js';

export function validate(schema: ZodType): RequestHandler {
  return async (req, res, next) => {
    const result = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      return ApiResponse.error(res, 'Validation failed', 400, formattedErrors);
    }

    next();
  };
}
