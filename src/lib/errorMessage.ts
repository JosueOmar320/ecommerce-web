import type { TFunction } from 'i18next';
import { isApiError } from '@/api/errors';
import { en } from '@/i18n/locales/en';

type ApiCode = keyof typeof en.errors.api;
const API_CODES = new Set<string>(Object.keys(en.errors.api));
const isTranslatedCode = (code: string): code is ApiCode => API_CODES.has(code);

const STATUS_FALLBACKS = [400, 401, 403, 404, 409, 422, 429, 500] as const;

/**
 * User-facing message for any error. Uses the backend's stable error code when we have copy for
 * it, then the HTTP status family, and never shows raw technical messages.
 */
export function getErrorMessage(error: unknown, t: TFunction): string {
  if (!isApiError(error)) return t('errors.genericBody');
  if (error.isNetworkError) return t('errors.networkBody');
  if (isTranslatedCode(error.code)) return t(`errors.api.${error.code}`);

  const status =
    error.status >= 500 ? 500 : (STATUS_FALLBACKS.find((s) => s === error.status) ?? 400);
  return t(`errors.status.http${status}`);
}
