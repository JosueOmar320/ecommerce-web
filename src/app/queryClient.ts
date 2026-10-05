import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/api/errors';

const MAX_RETRIES = 2;

/**
 * Defaults tuned for a store: catalog data is fresh for a minute (lists change slowly, stock is
 * re-read on product pages), and failed queries retry twice except for client errors.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        // 4xx answers will not change on retry (not found, forbidden, invalid): fail fast.
        retry: (failures, error) =>
          failures < MAX_RETRIES &&
          !(isApiError(error) && error.status >= 400 && error.status < 500),
      },
      mutations: { retry: false },
    },
  });
}
