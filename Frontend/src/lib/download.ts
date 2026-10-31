import { env } from '@config/env';
import { ApiError, getTenantSlug, tokenStorage } from '@/lib/api';

async function refreshAccessToken(): Promise<void> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const tenant = getTenantSlug();
  if (tenant) headers.set('X-Tenant', tenant);

  const response = await fetch(`${env.API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers,
  });
  const body = (await response.json()) as {
    data?: { accessToken?: string };
    message?: string;
  };
  if (!response.ok || !body.data?.accessToken) {
    throw new Error(body.message || 'Token refresh failed');
  }
  tokenStorage.set(body.data.accessToken);
}

export async function downloadFile(
  endpoint: string,
  filename: string,
  options?: { skipRefresh?: boolean },
): Promise<void> {
  const headers = new Headers();
  const token = tokenStorage.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const tenant = getTenantSlug();
  if (tenant) headers.set('X-Tenant', tenant);

  const url = `${env.API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && !options?.skipRefresh) {
    await refreshAccessToken();
    return downloadFile(endpoint, filename, { skipRefresh: true });
  }

  if (!response.ok) {
    let message = `Download failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(message, response.status);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="([^"]+)"/);
  const resolvedName = match?.[1] || filename;

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = resolvedName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
