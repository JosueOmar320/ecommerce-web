import { useCallback, useSyncExternalStore } from 'react';
import { readStorage, writeStorage } from '@/lib/storage';

/**
 * "Recently viewed" is a legitimate client-side feature (no API needed): the browser remembers
 * the last product slugs opened and the home page fetches their live details.
 */
const KEY = 'kestrel.recently-viewed';
const MAX = 8;
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const value: unknown = JSON.parse(readStorage(KEY) ?? '[]');
    return Array.isArray(value)
      ? value.filter((v): v is string => typeof v === 'string').slice(0, MAX)
      : [];
  } catch {
    return [];
  }
}

let snapshot = read();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRecentlyViewed() {
  const slugs = useSyncExternalStore(subscribe, () => snapshot);
  const record = useCallback((slug: string) => {
    if (snapshot[0] === slug) return;
    snapshot = [slug, ...snapshot.filter((s) => s !== slug)].slice(0, MAX);
    writeStorage(KEY, JSON.stringify(snapshot));
    for (const listener of listeners) listener();
  }, []);
  return { slugs, record };
}
