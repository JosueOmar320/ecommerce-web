import { ScrollRestoration } from 'react-router';

/**
 * Back/forward restores the previous position (keyed by history entry). A fresh page load has
 * the shared key "default", so it is keyed by URL instead: otherwise a reload could restore the
 * scroll position of an unrelated page.
 */
export function AppScrollRestoration() {
  return (
    <ScrollRestoration
      getKey={(location) =>
        location.key === 'default' ? location.pathname + location.search : location.key
      }
    />
  );
}
