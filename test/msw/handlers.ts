import { apiError, http, HttpResponse, url } from './http';

/**
 * Baseline: an anonymous visitor (no refresh cookie). Tests override handlers per scenario with
 * `server.use(...)`.
 */
export const handlers = [
  http.post(url('/api/v1/auth/refresh'), () => apiError(401, 'INVALID_REFRESH_TOKEN')),
  http.post(url('/api/v1/auth/logout'), () => new HttpResponse(null, { status: 204 })),
];
