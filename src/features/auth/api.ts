import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/api/client';
import type { CurrentUser, LoginRequest, RegisterRequest } from '@/api/schema';
import { tokenStore } from '@/api/session';
import { removeStorage } from '@/lib/storage';

export const authKeys = {
  me: ['session', 'me'] as const,
};

/**
 * Query-key roots that hold data belonging to the signed-in user. They are dropped on logout or
 * account switch; public catalog data stays cached.
 */
export const USER_SCOPED_ROOTS = [
  'session',
  'cart',
  'wishlist',
  'orders',
  'account',
  'admin',
] as const;

/** Browser-stored traces of what the previous person looked at or added. */
const USER_SCOPED_STORAGE = ['kestrel.recently-viewed', 'kestrel.cart-prices'];

export function clearUserData(queryClient: QueryClient) {
  for (const root of USER_SCOPED_ROOTS) queryClient.removeQueries({ queryKey: [root] });
  // Product details can include drafts when fetched by staff (`products:read`).
  queryClient.removeQueries({ queryKey: ['catalog', 'products', 'detail'] });
  for (const key of USER_SCOPED_STORAGE) removeStorage(key);
}

export const meQuery = queryOptions({
  queryKey: authKeys.me,
  queryFn: async () => (await unwrap(api.GET('/api/v1/auth/me'))).data,
  staleTime: 5 * 60_000,
});

/** A freshly issued session; the caller decides when to expose the token (see SessionProvider). */
export interface NewSession {
  accessToken: string;
  user: CurrentUser;
}

export const login = async (body: LoginRequest): Promise<NewSession> =>
  (await unwrap(api.POST('/api/v1/auth/login', { body }))).data;

export const register = async (body: RegisterRequest): Promise<NewSession> =>
  (await unwrap(api.POST('/api/v1/auth/register', { body }))).data;

export async function logout() {
  try {
    await unwrap(api.POST('/api/v1/auth/logout'));
  } finally {
    // Even if the network call fails, this browser must forget the session.
    tokenStore.set(null);
  }
}
