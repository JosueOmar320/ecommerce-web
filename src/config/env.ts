/**
 * Environment validated once at startup. Hand-written (not a schema library) because this module
 * is part of the initial bundle: two URL checks do not justify shipping a validator to every visitor.
 */
export interface Env {
  /** Base URL of the E-commerce API, e.g. https://api.shop.example */
  VITE_API_URL: string;
  /** Public origin of this app, used for canonical URLs and Open Graph tags. */
  VITE_SITE_URL: string;
}

const KEYS = ['VITE_API_URL', 'VITE_SITE_URL'] as const;

function httpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  } catch {
    return null;
  }
  return value.replace(/\/+$/, '');
}

export function parseEnv(source: Record<string, unknown>): Env {
  const env: Partial<Env> = {};
  const issues: string[] = [];
  for (const key of KEYS) {
    const value = httpUrl(source[key]);
    if (value === null) issues.push(`  - ${key}: expected an http(s) URL`);
    else env[key] = value;
  }
  if (issues.length > 0) {
    throw new Error(`Invalid environment configuration (see .env.example):\n${issues.join('\n')}`);
  }
  return env as Env;
}

/** Validated once at startup; import this instead of touching import.meta.env directly. */
export const env: Env = parseEnv(import.meta.env);
