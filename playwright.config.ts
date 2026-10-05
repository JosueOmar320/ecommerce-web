import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run the production build (vite preview) against a real API instance with
 * deterministic seed data (see e2e/README section in the project README and e2e/global-setup.ts).
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4173';
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  // The suite shares one seeded database and some tests change it: run serially.
  workers: 1,
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL,
    locale: 'en-US',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /mobile\.spec/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // Serves dist/: run `npm run build` first (CI does it in an earlier step).
        command: 'npm run preview',
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 60_000,
      },
});
