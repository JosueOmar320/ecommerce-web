import { describe, expect, it, vi } from 'vitest';
import { api, onSessionExpired, refreshAccessToken, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import { tokenStore } from '@/api/session';
import { customer } from '../../../test/msw/fixtures';
import { apiError, http, HttpResponse, url } from '../../../test/msw/http';
import { server } from '../../../test/msw/server';

const me = () => unwrap(api.GET('/api/v1/auth/me'));

/** /auth/me that accepts only `validToken` and reports TOKEN_EXPIRED for anything else. */
function meAccepting(validToken: string) {
  return http.get(url('/api/v1/auth/me'), ({ request }) =>
    request.headers.get('authorization') === `Bearer ${validToken}`
      ? HttpResponse.json({ data: customer })
      : apiError(401, 'TOKEN_EXPIRED'),
  );
}

describe('API client', () => {
  it('sends the access token and parses the success envelope', async () => {
    tokenStore.set('token-1');
    server.use(meAccepting('token-1'));
    await expect(me()).resolves.toEqual({ data: customer });
  });

  it('refreshes once for many concurrent expired requests, then replays them', async () => {
    tokenStore.set('expired');
    let refreshCalls = 0;
    server.use(
      meAccepting('fresh'),
      http.post(url('/api/v1/auth/refresh'), async () => {
        refreshCalls++;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({
          data: { accessToken: 'fresh', tokenType: 'Bearer', expiresIn: 900 },
        });
      }),
    );

    const results = await Promise.all([me(), me(), me(), me()]);
    expect(results).toHaveLength(4);
    expect(refreshCalls).toBe(1);
    expect(tokenStore.get()).toBe('fresh');
  });

  it('retries the refresh once when another tab rotated the cookie (409)', async () => {
    let attempts = 0;
    server.use(
      http.post(url('/api/v1/auth/refresh'), () => {
        attempts++;
        return attempts === 1
          ? apiError(409, 'REFRESH_TOKEN_ALREADY_ROTATED')
          : HttpResponse.json({
              data: { accessToken: 'after-race', tokenType: 'Bearer', expiresIn: 900 },
            });
      }),
    );
    await expect(refreshAccessToken()).resolves.toBe('after-race');
    expect(attempts).toBe(2);
  });

  it('reports an expired session when the refresh token is no longer valid', async () => {
    tokenStore.set('expired');
    const listener = vi.fn();
    const unsubscribe = onSessionExpired(listener);
    server.use(meAccepting('never'));

    await expect(me()).rejects.toMatchObject({ status: 401, code: 'TOKEN_EXPIRED' });
    expect(listener).toHaveBeenCalledOnce();
    expect(tokenStore.get()).toBeNull();
    unsubscribe();
  });

  it('does not try to refresh for other 401 causes', async () => {
    tokenStore.set('token');
    const refresh = vi.fn();
    server.use(
      http.get(url('/api/v1/auth/me'), () => apiError(401, 'INVALID_TOKEN')),
      http.post(url('/api/v1/auth/refresh'), () => {
        refresh();
        return HttpResponse.json({});
      }),
    );
    await expect(me()).rejects.toMatchObject({ code: 'INVALID_TOKEN' });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('turns network failures into a NETWORK_ERROR ApiError', async () => {
    server.use(http.get(url('/api/v1/auth/me'), () => HttpResponse.error()));
    const error = await me().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNetworkError).toBe(true);
  });

  it('exposes field issues from validation errors', async () => {
    server.use(
      http.post(url('/api/v1/auth/login'), () =>
        apiError(400, 'VALIDATION_ERROR', 'Request validation failed', {
          location: 'body',
          issues: [{ path: '/email', message: 'Invalid email' }],
        }),
      ),
    );
    const error = (await unwrap(
      api.POST('/api/v1/auth/login', { body: { email: 'x', password: 'y' } }),
    ).catch((e: unknown) => e)) as ApiError;
    expect(error.fieldIssues).toEqual({ '/email': 'Invalid email' });
  });
});
