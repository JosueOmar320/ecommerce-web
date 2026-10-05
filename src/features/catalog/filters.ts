import { z } from 'zod';

export const SORTS = ['relevance', 'newest', 'price_asc', 'price_desc', 'name_asc'] as const;
export type Sort = (typeof SORTS)[number];
export const PAGE_SIZE = 24; // divisible by 2, 3 and 4 columns

const optionalText = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => (v ? v : undefined));

/** Same rule as the API: major units with at most two decimals (e.g. "499.99"). */
const money = z
  .string()
  .regex(/^\d{1,9}(\.\d{1,2})?$/)
  .optional()
  .catch(undefined);

/**
 * Products filters as they live in the URL. Every value is validated: anything malformed or
 * hand-edited is dropped instead of being forwarded to the API (or crashing the page).
 */
export const productFiltersSchema = z.object({
  search: optionalText.catch(undefined),
  category: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120)
    .optional()
    .catch(undefined),
  brand: optionalText.catch(undefined),
  minPrice: money,
  maxPrice: money,
  availability: z.enum(['in_stock', 'out_of_stock']).optional().catch(undefined),
  sort: z.enum(SORTS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).optional().catch(undefined),
});

export type ProductFilters = Partial<z.infer<typeof productFiltersSchema>>;

export function parseFilters(params: URLSearchParams): ProductFilters {
  const filters = productFiltersSchema.parse(Object.fromEntries(params));
  // The API rejects relevance without a search term and an inverted price range.
  if (filters.sort === 'relevance' && !filters.search) filters.sort = undefined;
  if (filters.minPrice && filters.maxPrice && Number(filters.minPrice) > Number(filters.maxPrice)) {
    filters.maxPrice = undefined;
  }
  return filters;
}

export function serializeFilters(filters: Partial<ProductFilters>): URLSearchParams {
  const params = new URLSearchParams();
  // Object.entries drops the optionality from the value type; restore it explicitly.
  const entries = Object.entries(filters) as [string, string | number | undefined][];
  for (const [key, value] of entries) {
    if (value === undefined || (key === 'page' && value === 1)) continue;
    params.set(key, String(value));
  }
  return params;
}

/** Number of user-chosen filters (search and sort excluded), for the "Filters (2)" button. */
export function countActiveFilters(filters: ProductFilters): number {
  return [
    filters.category,
    filters.brand,
    filters.minPrice ?? filters.maxPrice,
    filters.availability,
  ].filter(Boolean).length;
}
