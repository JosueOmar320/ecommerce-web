import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { tokenStore } from '@/api/session';
import { i18n } from '@/i18n';
import { server } from './msw/server';

// jsdom has no matchMedia; MUI's colour-scheme manager and useMediaQuery need it.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- DOM types say it always exists; jsdom disagrees.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Any request without a handler fails the test: no accidental calls to a real backend.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
afterAll(() => {
  server.close();
});

beforeEach(async () => {
  tokenStore.set(null);
  window.localStorage.clear();
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});
