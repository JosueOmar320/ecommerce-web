import { http, HttpResponse } from 'msw';
import type { paths } from '@/api/schema';

export const API = 'http://api.test';

type Path = keyof paths;
/** Absolute MSW URL for an OpenAPI path, e.g. url('/api/v1/products/{idOrSlug}') → .../:idOrSlug */
export const url = (path: Path) => `${API}${path.replace(/\{(\w+)\}/g, ':$1')}`;

/** The backend's error envelope, so error handling is tested against the real shape. */
export function apiError(status: number, code: string, message = code, details: unknown = null) {
  return HttpResponse.json(
    { error: { code, message, details, requestId: 'req-test' } },
    { status },
  );
}

export { http, HttpResponse };
