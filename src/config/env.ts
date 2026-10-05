import { z } from 'zod';

const url = z.url({ protocol: /^https?$/ }).transform((value) => value.replace(/\/+$/, ''));

export const envSchema = z.object({
  /** Base URL of the E-commerce API, e.g. https://api.shop.example */
  VITE_API_URL: url,
  /** Public origin of this app, used for canonical URLs and Open Graph tags. */
  VITE_SITE_URL: url,
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, unknown>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration (see .env.example):\n${issues}`);
  }
  return result.data;
}

/** Validated once at startup; import this instead of touching import.meta.env directly. */
export const env: Env = parseEnv(import.meta.env);
