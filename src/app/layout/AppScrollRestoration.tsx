import { useState } from 'react';
import { ScrollRestoration } from 'react-router';

const STORAGE_KEY = 'kestrel.scroll-positions';

const urlKey = (location: { pathname: string; search: string }) =>
  location.pathname + location.search;

/**
 * A fresh page load (typed URL, external link) must start at the top; only a reload should
 * bring back the previous position. Drops this URL's saved position unless the page was reloaded.
 */
function forgetPositionOnFreshLoad() {
  try {
    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (entry?.type === 'reload') return;
    const positions = new Map(
      Object.entries(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}') as object),
    );
    if (positions.delete(urlKey(window.location))) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(positions)));
    }
  } catch {
    // Storage unavailable (private mode): nothing was saved either.
  }
}

/**
 * Back/forward restores the previous position (keyed by history entry). A page load has the
 * shared key "default", so it is keyed by URL instead: otherwise a reload could restore the
 * scroll position of an unrelated page.
 */
export function AppScrollRestoration() {
  // Runs once, before ScrollRestoration reads the stored positions.
  useState(forgetPositionOnFreshLoad);
  return (
    <ScrollRestoration
      storageKey={STORAGE_KEY}
      getKey={(location) => (location.key === 'default' ? urlKey(location) : location.key)}
    />
  );
}
