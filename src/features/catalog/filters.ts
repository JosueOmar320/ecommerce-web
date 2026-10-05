export const SORTS = ['relevance', 'newest', 'price_asc', 'price_desc', 'name_asc'] as const;
export type Sort = (typeof SORTS)[number];
export const AVAILABILITIES = ['in_stock', 'out_of_stock'] as const;
export const PAGE_SIZE = 24; // divisible by 2, 3 and 4 columns

export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  availability?: (typeof AVAILABILITIES)[number];
  sort?: Sort;
  page?: number;
}

/*
 * Small hand-written parsers instead of a schema library: this module is on the storefront's
 * initial path (header and catalog), where every kilobyte counts.
 */
const text = (value: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length <= 100 ? trimmed : undefined;
};
const matching = (value: string | null, pattern: RegExp) =>
  value !== null && pattern.test(value) ? value : undefined;
const oneOf = <T extends string>(value: string | null, options: readonly T[]) =>
  options.find((option) => option === value);

const SLUG = /^(?=.{1,120}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Same rule as the API: major units with at most two decimals (e.g. "499.99"). */
const MONEY = /^\d{1,9}(\.\d{1,2})?$/;

/**
 * Product filters as they live in the URL. Every value is validated: anything malformed or
 * hand-edited is dropped instead of being forwarded to the API (or crashing the page).
 */
export function parseFilters(params: URLSearchParams): ProductFilters {
  const page = Number(params.get('page'));
  const filters: ProductFilters = {
    search: text(params.get('search')),
    category: matching(params.get('category'), SLUG),
    brand: text(params.get('brand')),
    minPrice: matching(params.get('minPrice'), MONEY),
    maxPrice: matching(params.get('maxPrice'), MONEY),
    availability: oneOf(params.get('availability'), AVAILABILITIES),
    sort: oneOf(params.get('sort'), SORTS),
    page: Number.isInteger(page) && page >= 1 && page <= 10_000 ? page : undefined,
  };
  // The API rejects relevance without a search term and an inverted price range.
  if (filters.sort === 'relevance' && !filters.search) filters.sort = undefined;
  if (filters.minPrice && filters.maxPrice && Number(filters.minPrice) > Number(filters.maxPrice)) {
    filters.maxPrice = undefined;
  }
  // Drop unset keys so filters compare (and serialize) cleanly.
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined));
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
