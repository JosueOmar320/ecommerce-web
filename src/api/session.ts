/**
 * The access token lives in memory only: never in localStorage/sessionStorage, where any XSS
 * could read it. The long-lived refresh token is an httpOnly cookie the browser manages and
 * JavaScript cannot see; a page reload restores the session through POST /auth/refresh.
 */
type Listener = () => void;

let accessToken: string | null = null;
const listeners = new Set<Listener>();

export const tokenStore = {
  get: (): string | null => accessToken,
  set: (token: string | null): void => {
    if (token === accessToken) return;
    accessToken = token;
    for (const listener of listeners) listener();
  },
  /** useSyncExternalStore-compatible subscription. */
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
