import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { onSessionExpired, refreshAccessToken } from '@/api/client';
import type { CurrentUser, LoginRequest, Permission, RegisterRequest } from '@/api/schema';
import { tokenStore } from '@/api/session';
import {
  authKeys,
  clearUserData,
  login as loginRequest,
  logout as logoutRequest,
  meQuery,
  type NewSession,
  register as registerRequest,
} from './api';

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

interface SessionContextValue {
  status: SessionStatus;
  user: CurrentUser | undefined;
  /** Why the last session ended without a plain sign-out, to explain the redirect to login. */
  endReason: SessionEndReason | null;
  hasPermission: (...permissions: Permission[]) => boolean;
  login: (body: LoginRequest) => Promise<CurrentUser>;
  register: (body: RegisterRequest) => Promise<CurrentUser>;
  /**
   * Ends the session in this browser in any case. Resolves to false when the API could not be
   * reached to revoke the refresh cookie (offline), so callers can tell the user.
   */
  logout: (reason?: SessionEndReason) => Promise<boolean>;
}

/** `expired`: the refresh token is no longer valid. `passwordChanged`: the API revoked every session. */
export type SessionEndReason = 'expired' | 'passwordChanged';

const SessionContext = createContext<SessionContextValue | null>(null);

const channel =
  typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('kestrel.session');
type SessionMessage = { type: 'login' } | { type: 'logout' };

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const token = useSyncExternalStore(tokenStore.subscribe, tokenStore.get);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [endReason, setEndReason] = useState<SessionEndReason | null>(null);

  // Restore the session from the httpOnly refresh cookie once per page load.
  useEffect(() => {
    let active = true;
    refreshAccessToken()
      .catch(() => null) // offline at startup: continue anonymously, requests will report errors
      .finally(() => {
        if (active) setBootstrapping(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () =>
      onSessionExpired(() => {
        clearUserData(queryClient);
        setEndReason('expired');
      }),
    [queryClient],
  );

  // Keep tabs consistent: signing out in one tab signs out everywhere; signing in elsewhere is picked up.
  useEffect(() => {
    if (!channel) return;
    const onMessage = (event: MessageEvent<SessionMessage>) => {
      if (event.data.type === 'logout') {
        tokenStore.set(null);
        clearUserData(queryClient);
      } else {
        // Another tab signed in, possibly as someone else: never keep the previous account's data.
        clearUserData(queryClient);
        void refreshAccessToken();
      }
    };
    channel.addEventListener('message', onMessage);
    return () => {
      channel.removeEventListener('message', onMessage);
    };
  }, [queryClient]);

  const me = useQuery({ ...meQuery, enabled: token !== null });

  const status: SessionStatus =
    bootstrapping || (token !== null && me.isPending)
      ? 'loading'
      : token && me.data
        ? 'authenticated'
        : 'anonymous';

  const begin = useCallback(
    ({ accessToken, user }: NewSession) => {
      clearUserData(queryClient); // never show a previous account's data
      // Seed the user before exposing the token, so `me` does not refetch what login returned.
      queryClient.setQueryData(authKeys.me, user);
      tokenStore.set(accessToken);
      setEndReason(null);
      channel?.postMessage({ type: 'login' } satisfies SessionMessage);
      return user;
    },
    [queryClient],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      user: token ? me.data : undefined,
      endReason,
      hasPermission: (...permissions) =>
        permissions.every((p) => me.data?.permissions.includes(p) ?? false),
      login: async (body) => begin(await loginRequest(body)),
      register: async (body) => begin(await registerRequest(body)),
      logout: async (reason) => {
        try {
          await logoutRequest();
          return true;
        } catch {
          return false;
        } finally {
          clearUserData(queryClient);
          setEndReason(reason ?? null);
          channel?.postMessage({ type: 'logout' } satisfies SessionMessage);
        }
      },
    }),
    [status, token, me.data, endReason, begin, queryClient],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionContextValue {
  const context = use(SessionContext);
  if (!context) throw new Error('useSession must be used inside <SessionProvider>');
  return context;
}
