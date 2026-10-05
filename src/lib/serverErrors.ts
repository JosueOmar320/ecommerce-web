import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { isApiError } from '@/api/errors';

/**
 * Maps a 400 VALIDATION_ERROR from the API onto form fields (issues use JSON pointers like
 * "/email"). Returns true when at least one field was flagged, so the caller can skip the
 * form-level message.
 */
export function applyServerFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  message: string,
): boolean {
  if (!isApiError(error) || error.code !== 'VALIDATION_ERROR') return false;
  let applied = false;
  for (const path of Object.keys(error.fieldIssues)) {
    const field = fields.find((name) => `/${name}` === path);
    if (field) {
      setError(field, { type: 'server', message });
      applied = true;
    }
  }
  return applied;
}
