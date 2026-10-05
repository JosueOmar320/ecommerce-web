/**
 * Only same-origin, absolute paths are accepted as post-login destinations: `?redirect=` comes
 * from the URL and must not be usable for open redirects (`//evil.com`, `https://…`, `javascript:`).
 */
export function safeRedirect(value: string | null | undefined, fallback = '/'): string {
  if (!value?.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
}

export function loginPath(returnTo: string) {
  return `/login?redirect=${encodeURIComponent(returnTo)}`;
}
