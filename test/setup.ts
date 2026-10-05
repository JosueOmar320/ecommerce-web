import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
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

// Integration tests render real lazy routes; under a parallel run the first render of a file can
// take longer than the 1 s default. A generous wait avoids flaky failures without slowing passes.
configure({ asyncUtilTimeout: 4000 });

// React reports invalid markup (e.g. a <div> inside a <p>) and missing list keys only as console
// errors; fail the test instead, so they cannot slip into the UI unnoticed.
const FATAL_REACT_WARNINGS = [
  'cannot be a descendant of',
  'cannot contain a nested',
  'should have a unique "key" prop',
];
const reactWarnings: string[] = [];
const consoleError = console.error.bind(console);

// Any request without a handler fails the test: no accidental calls to a real backend.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
afterAll(() => {
  server.close();
});

beforeEach(async () => {
  // Installed per test: `restoreMocks` resets spies between tests.
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const message = args.map(String).join(' ');
    // Throwing here would be swallowed by React; collect and fail in afterEach instead.
    if (FATAL_REACT_WARNINGS.some((warning) => message.includes(warning))) {
      reactWarnings.push(message);
    }
    consoleError(...args);
  });
  tokenStore.set(null);
  window.localStorage.clear();
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  const warnings = reactWarnings.splice(0);
  if (warnings.length > 0) {
    throw new Error(`React warnings:\n${warnings.map((w) => w.slice(0, 300)).join('\n')}`);
  }
});
