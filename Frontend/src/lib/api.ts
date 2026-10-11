import { env } from '@config/env';

export interface ApiResponseBody<T = unknown> {
  data: T | null;
  message: string;
  status: number;
  errors?: Array<{ path: string; message: string }>;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly data: unknown;
  public readonly errors: Array<{ path: string; message: string }>;

  constructor(
    message: string,
    status: number,
    data: unknown = null,
    errors: Array<{ path: string; message: string }> = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.errors = errors;
  }
}

const ACCESS_TOKEN_KEY = 'accessToken';

export const tokenStorage = {
  get: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  set: (token: string) => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  remove: () => localStorage.removeItem(ACCESS_TOKEN_KEY),
};

export function getTenantSlug(): string | null {
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return new URLSearchParams(window.location.search).get('tenant');
  }

  const parts = hostname.split('.');
  return parts.length >= 3 ? parts[0] : null;
}

let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const headers = new Headers({ 'Content-Type': 'application/json' });
      const tenant = getTenantSlug();
      if (tenant) headers.set('X-Tenant', tenant);

      const response = await fetch(`${env.API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });

      const body = (await response.json()) as ApiResponseBody<{
        accessToken?: string;
      }>;
      if (!response.ok || !body.data?.accessToken) {
        throw new Error(body.message || 'Token refresh failed');
      }

      tokenStorage.set(body.data.accessToken);
    } catch (error) {
      tokenStorage.remove();
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponseBody<T>> {
  const {
    body,
    skipAuth = false,
    skipRefresh = false,
    headers: suppliedHeaders,
    ...fetchOptions
  } = options;
  const headers = new Headers(suppliedHeaders);

  if (body !== undefined && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const token = tokenStorage.get();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const tenant = getTenantSlug();
  if (tenant) headers.set('X-Tenant', tenant);

  const url = `${env.API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
    ...(body === undefined
      ? {}
      : {
          body:
            body instanceof FormData || typeof body === 'string'
              ? body
              : JSON.stringify(body),
        }),
  });

  if (response.status === 401 && !skipAuth && !skipRefresh) {
    try {
      await refreshAccessToken();
      return request<T>(endpoint, { ...options, skipRefresh: true });
    } catch {
      // Preserve the original response error if the refresh attempt fails.
    }
  }

  const responseBody = await parseResponse(response);
  if (!response.ok) {
    const errorBody = responseBody as Partial<ApiResponseBody> | null;
    throw new ApiError(
      errorBody?.message || `Request failed with status ${response.status}`,
      response.status,
      errorBody?.data ?? null,
      errorBody?.errors ?? [],
    );
  }

  return (responseBody ?? {
    data: null,
    message: 'Success',
    status: response.status,
  }) as ApiResponseBody<T>;
}

export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ) => request<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ) => request<T>(endpoint, { ...options, method: 'PUT', body }),
  patch: <T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ) => request<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export function buildQueryString(
  params: object | undefined,
): string {
  if (!params) return '';

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
