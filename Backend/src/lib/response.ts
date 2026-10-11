import type { Response } from 'express';

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiResponseBody<T = unknown> {
  data: T | null;
  message: string;
  status: number;
  errors?: ApiErrorDetail[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    status = 200,
  ) {
    return res.status(status).json({
      status,
      message,
      data,
    });
  }

  static created<T>(res: Response, data: T, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static paginated<T>(
    res: Response,
    items: T[],
    pagination: PaginationMeta,
    message = 'Data fetched successfully',
  ) {
    return ApiResponse.success(
      res,
      { items, pagination },
      message,
    );
  }

  static error(
    res: Response,
    message: string,
    status = 400,
    errors?: ApiErrorDetail[],
  ) {
    const body: ApiResponseBody<null> = {
      status,
      message,
      data: null,
    };

    if (errors?.length) {
      body.errors = errors;
    }

    return res.status(status).json(body);
  }
}
