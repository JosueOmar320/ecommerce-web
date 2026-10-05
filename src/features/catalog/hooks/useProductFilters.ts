import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { parseFilters, serializeFilters, type ProductFilters } from '../filters';

interface UpdateOptions {
  /** Replace the history entry (used while typing a search) instead of pushing a new one. */
  replace?: boolean;
}

/**
 * Filters, search, sort and page live in the URL: shareable, survive a refresh, and work with
 * back/forward. Changing any filter resets pagination to page 1.
 */
export function useProductFilters(fixed: Partial<ProductFilters> = {}) {
  const [params, setParams] = useSearchParams();
  const fromUrl = useMemo(() => parseFilters(params), [params]);
  const filters = useMemo(() => ({ ...fromUrl, ...fixed }), [fromUrl, fixed]);

  const update = useCallback(
    (changes: Partial<ProductFilters>, options: UpdateOptions = {}) => {
      const merged: ProductFilters = { ...fromUrl, ...changes };
      if (!('page' in changes)) merged.page = undefined;
      // Fixed filters (e.g. the category of a category page) belong to the path, not the query.
      const next = Object.fromEntries(
        Object.entries(merged).filter(([key]) => !(key in fixed)),
      ) as ProductFilters;
      setParams(serializeFilters(next), {
        replace: options.replace ?? false,
        preventScrollReset: true,
      });
    },
    [fromUrl, fixed, setParams],
  );

  const clear = useCallback(() => {
    setParams(serializeFilters({ search: fromUrl.search, sort: fromUrl.sort }), {
      preventScrollReset: true,
    });
  }, [fromUrl.search, fromUrl.sort, setParams]);

  return { filters, update, clear };
}
