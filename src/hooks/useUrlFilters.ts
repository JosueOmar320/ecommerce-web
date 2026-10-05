import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { z } from 'zod';

type Filters = Record<string, string | number | boolean | undefined>;

interface UpdateOptions {
  /** Replace the history entry (while typing a search) instead of pushing a new one. */
  replace?: boolean;
}

/**
 * List state (filters, search, page) kept in the URL: shareable, survives a refresh and works with
 * back/forward. The schema should `.catch()` every field so malformed URLs fall back instead of
 * failing. Changing any filter other than `page` resets pagination.
 */
export function useUrlFilters<S extends z.ZodType<Filters & { page?: number }>>(schema: S) {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => schema.parse(Object.fromEntries(params)), [schema, params]);

  const update = useCallback(
    (changes: Partial<z.output<S>>, options: UpdateOptions = {}) => {
      const merged: Filters = { ...filters, ...changes };
      if (!('page' in changes)) merged.page = undefined;
      const next = new URLSearchParams();
      for (const [key, value] of Object.entries(merged)) {
        if (value === undefined || value === '' || (key === 'page' && value === 1)) continue;
        next.set(key, String(value));
      }
      // Discrete choices render synchronously (see useProductFilters); typing stays a transition.
      setParams(next, {
        replace: options.replace ?? false,
        preventScrollReset: true,
        flushSync: !options.replace,
      });
    },
    [filters, setParams],
  );

  return { filters, update };
}
