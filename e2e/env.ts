/** Where the API under test runs; the build under test must point at the same URL. */
export const API_URL = (process.env.E2E_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

/**
 * Development-only accounts created by the API's seed (`npm run db:seed` in ecommerce-api).
 * They exist only in local and CI databases built from that seed.
 */
export const USERS = {
  customer: { email: 'customer@example.com', password: 'Password123!', firstName: 'Carlos' },
  admin: { email: 'admin@example.com', password: 'Password123!', firstName: 'Ada' },
} as const;

export type Role = keyof typeof USERS;
