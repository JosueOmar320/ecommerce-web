/**
 * Idempotency keys for operations that must never run twice (placing an order, paying).
 * A key is created once per logical attempt and kept in sessionStorage, so a page reload or a
 * network retry in the middle of the request sends the same key and the API replays the original
 * response instead of creating a second order.
 */
const PREFIX = 'kestrel.idempotency.';

export function getIdempotencyKey(scope: string): string {
  try {
    const existing = window.sessionStorage.getItem(PREFIX + scope);
    if (existing) return existing;
    const key = crypto.randomUUID();
    window.sessionStorage.setItem(PREFIX + scope, key);
    return key;
  } catch {
    return crypto.randomUUID();
  }
}

/** Call once the attempt is finished (success, or a definitive failure needing a new attempt). */
export function clearIdempotencyKey(scope: string) {
  try {
    window.sessionStorage.removeItem(PREFIX + scope);
  } catch {
    // Ignore.
  }
}
