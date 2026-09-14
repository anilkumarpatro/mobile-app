import { API, type ApiServiceKey } from './config';
import { getAuthToken, clearAuthSession } from './tokenStorage';

type RequestOptions = RequestInit & { baseUrl?: ApiServiceKey; skipAuth?: boolean };

let onUnauthorized: (() => void) | null = null;
let handlingUnauthorized = false;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function handleUnauthorizedResponse() {
  if (handlingUnauthorized) return;
  handlingUnauthorized = true;
  try {
    await clearAuthSession();
    onUnauthorized?.();
  } finally {
    handlingUnauthorized = false;
  }
}

const REQUEST_TIMEOUT_MS = 20000;

/** Without this a blocked connection hangs until Android's socket timeout with no usable error. */
export async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    const cause = error as Error;
    if (cause?.name === 'AbortError') {
      throw new Error(`Server did not respond within 20s (${url}).`);
    }
    throw new Error(`Cannot reach server (${url}): ${cause?.message ?? 'network error'}`);
  } finally {
    clearTimeout(timer);
  }
}

export async function parseJsonResponse(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function getErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
  }
  if (typeof data === 'string') return data;
  return `Request failed (${status})`;
}

export async function authHeaders(extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { Accept: 'application/json', ...extra };
  const token = await getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function authFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
  baseUrl: ApiServiceKey = 'userManagement',
): Promise<T> {
  const base = API[baseUrl];
  const headers = await authHeaders(
    options.body ? { 'Content-Type': 'application/json' } : {},
  );

  const res = await fetchWithTimeout(`${base}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  const data = await parseJsonResponse(res);
  if (res.status === 401 && !options.skipAuth) {
    await handleUnauthorizedResponse();
  }
  if (!res.ok) throw new Error(getErrorMessage(data, res.status));
  return data as T;
}

/** @deprecated use authFetch */
export async function apiFetch(path: string, options: RequestOptions = {}) {
  return authFetch(path, options, options.baseUrl ?? 'userManagement');
}
