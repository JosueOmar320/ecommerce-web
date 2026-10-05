import createClient from 'openapi-fetch';
import { env } from '@/config/env';
import { ApiError, networkError, toApiError } from './errors';
import type { paths } from './schema';
import { tokenStore } from './session';

const AUTH_PATH = '/api/v1/auth/';
const REFRESH_URL = `${env.VITE_API_URL}/api/v1/auth/refresh`;

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

/** Notified when the session can no longer be renewed (refresh token expired or revoked). */
export function onSessionExpired(listener: SessionExpiredListener) {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Exchanges the httpOnly refresh cookie for a new access token. Single-flight: concurrent callers
 * (several requests that all got 401 at once, or StrictMode's double mount) share one request, so
 * the rotating refresh token is never spent twice.
 *
 * Resolves to null when there is no valid session (not an error: the visitor is anonymous).
 */
export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        let response: Response;
        try {
          response = await fetch(REFRESH_URL, { method: 'POST', credentials: 'include' });
        } catch {
          throw networkError();
        }
        if (response.ok) {
          const body = (await response.json()) as { data: { accessToken: string } };
          tokenStore.set(body.data.accessToken);
          return body.data.accessToken;
        }
        // Another tab rotated the cookie a moment ago; the browser now holds the new one.
        if (response.status === 409 && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          continue;
        }
        break;
      }
      tokenStore.set(null);
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function send(request: Request, token: string | null): Promise<Response> {
  const headers = new Headers(request.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  try {
    return await fetch(new Request(request, { headers, credentials: 'include' }));
  } catch {
    throw networkError();
  }
}

/**
 * fetch used by the generated client: adds the bearer token and transparently renews it once
 * when the API answers 401 TOKEN_EXPIRED, then replays the original request.
 */
export async function authFetch(input: Request): Promise<Response> {
  const retryCopy = input.clone();
  const tokenUsed = tokenStore.get();
  const response = await send(input, tokenUsed);

  const isAuthEndpoint =
    new URL(input.url).pathname.startsWith(AUTH_PATH) && !input.url.endsWith('/auth/me');
  if (response.status !== 401 || !tokenUsed || isAuthEndpoint) return response;

  const body: unknown = await response
    .clone()
    .json()
    .catch(() => null);
  if (toApiError(401, body).code !== 'TOKEN_EXPIRED') return response;

  // If another request already refreshed while this one was in flight, reuse that token.
  const fresh = tokenStore.get() !== tokenUsed ? tokenStore.get() : await refreshAccessToken();
  if (!fresh) {
    for (const listener of sessionExpiredListeners) listener();
    return response;
  }
  return send(retryCopy, fresh);
}

export const api = createClient<paths>({ baseUrl: env.VITE_API_URL, fetch: authFetch });

/**
 * Turns openapi-fetch's `{ data, error, response }` into "data or throw ApiError", so TanStack
 * Query sees real failures and components never inspect raw responses.
 */
export async function unwrap<T>(
  promise: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await promise;
  if (!response.ok || error !== undefined) throw toApiError(response.status, error);
  return data as T;
}

export { ApiError };
