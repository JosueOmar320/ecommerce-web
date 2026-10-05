import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { api, unwrap } from '@/api/client';
import type { CategoryNode } from '@/api/schema';
import { PAGE_SIZE, type ProductFilters } from './filters';

/**
 * Query keys: one root per resource, filters as the last segment, so invalidating
 * catalogKeys.products() refreshes every list and catalogKeys.all every catalog query.
 */
export const catalogKeys = {
  all: ['catalog'] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
  products: () => [...catalogKeys.all, 'products'] as const,
  productList: (filters: ProductFilters) => [...catalogKeys.products(), 'list', filters] as const,
  product: (idOrSlug: string) => [...catalogKeys.products(), 'detail', idOrSlug] as const,
};

export const categoriesQuery = queryOptions({
  queryKey: catalogKeys.categories(),
  queryFn: async () => (await unwrap(api.GET('/api/v1/categories'))).data,
  // The tree changes rarely (and is cached server-side too).
  staleTime: 10 * 60_000,
});

export function productListQuery(filters: ProductFilters, pageSize = PAGE_SIZE) {
  return queryOptions({
    queryKey: catalogKeys.productList({ ...filters, page: filters.page ?? 1 }),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/api/v1/products', {
          params: { query: { ...filters, page: filters.page ?? 1, pageSize } },
          signal, // typing fast cancels the previous search request
        }),
      ),
    // Keep showing the previous page while the next one loads (no layout jump, no blank grid).
    placeholderData: keepPreviousData,
  });
}

export function productQuery(idOrSlug: string) {
  return queryOptions({
    queryKey: catalogKeys.product(idOrSlug),
    queryFn: async ({ signal }) =>
      (
        await unwrap(
          api.GET('/api/v1/products/{idOrSlug}', { params: { path: { idOrSlug } }, signal }),
        )
      ).data,
    // Stock and prices matter on the product page: refresh more eagerly than lists.
    staleTime: 15_000,
  });
}

/** Depth-first lookup in the category tree. */
export function findCategory(nodes: CategoryNode[], slug: string): CategoryNode | undefined {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const found = findCategory(node.children, slug);
    if (found) return found;
  }
  return undefined;
}
