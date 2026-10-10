import type { Response } from 'express';

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    status = 200,
  ) {
    return res.status(status).json({
      success: true,
      message,
      data,
    });
  }

  static created<T>(res: Response, data: T, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(
    res: Response,
    message: string,
    status = 400,
    details?: unknown,
  ) {
    return res.status(status).json({
      success: false,
      error: message,
      ...(details !== undefined ? { details } : {}),
    });
  }
}
