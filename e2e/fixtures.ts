import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type Page } from '@playwright/test';
import { API_URL, USERS, type Role } from './env';

interface Session {
  accessToken: string;
}

interface Fixtures {
  /** Signs in through the API: the refresh cookie lands in the browser context. */
  loginAs: (role: Role) => Promise<Session>;
  /** Calls the API as a signed-in user (for test setup only, never for assertions on UI state). */
  api: (session: Session, method: string, path: string, body?: unknown) => Promise<Response>;
}

export const test = base.extend<Fixtures>({
  loginAs: async ({ page }, use) => {
    await use(async (role) => {
      const { email, password } = USERS[role];
      const response = await page.request.post(`${API_URL}/api/v1/auth/login`, {
        data: { email, password },
      });
      expect(response.ok(), `login as ${role}`).toBe(true);
      const { data } = (await response.json()) as { data: { accessToken: string } };
      return { accessToken: data.accessToken };
    });
  },
  // eslint-disable-next-line no-empty-pattern -- Playwright requires the fixtures argument.
  api: async ({}, use) => {
    await use((session, method, path, body) =>
      fetch(`${API_URL}${path}`, {
        method,
        headers: {
          authorization: `Bearer ${session.accessToken}`,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
  },
});

export { expect };

/** WCAG 2.2 A/AA rules in a real browser (colour contrast included). */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.id} (${v.impact ?? 'n/a'}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
  expect(summary, `axe violations on ${page.url()}`).toEqual([]);
}
