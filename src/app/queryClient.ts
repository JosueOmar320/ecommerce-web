import { QueryClient } from '@tanstack/react-query';

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
        retry: 2,
      },
      mutations: { retry: false },
    },
  });
}
