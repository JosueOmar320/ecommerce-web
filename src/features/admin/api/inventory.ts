import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, unwrap } from '@/api/client';
import type { ManualInventoryMovement } from '@/api/schema';
import { catalogKeys } from '@/features/catalog/api';
import { ADMIN_PAGE_SIZE, adminKeys } from './keys';

/** The API's default low-stock threshold. */
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;
export const MOVEMENTS_PAGE_SIZE = 10;

export const inventoryFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  lowStock: z.enum(['true']).optional().catch(undefined),
  threshold: z.coerce.number().int().min(0).max(100_000).optional().catch(undefined),
  variant: z.string().min(1).optional().catch(undefined),
});
export type InventoryFilters = z.output<typeof inventoryFiltersSchema>;

export function inventoryQuery({ page, lowStock, threshold }: InventoryFilters) {
  const filters = { page, lowStock, threshold: lowStock ? threshold : undefined };
  return queryOptions({
    queryKey: adminKeys.inventoryList(filters),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/api/v1/inventory', {
          params: { query: { ...filters, pageSize: ADMIN_PAGE_SIZE } },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function inventoryLevelQuery(variantId: string) {
  return queryOptions({
    queryKey: [...adminKeys.inventory(), 'level', variantId],
    queryFn: async () =>
      (await unwrap(api.GET('/api/v1/inventory/{variantId}', { params: { path: { variantId } } })))
        .data,
  });
}

export function movementsQuery(variantId: string, page: number) {
  return queryOptions({
    queryKey: adminKeys.movements(variantId, page),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/inventory/{variantId}/movements', {
          params: { path: { variantId }, query: { page, pageSize: MOVEMENTS_PAGE_SIZE } },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useRecordMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ variantId, body }: { variantId: string; body: ManualInventoryMovement }) =>
      (
        await unwrap(
          api.POST('/api/v1/inventory/{variantId}/movements', {
            params: { path: { variantId } },
            body,
          }),
        )
      ).data,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.inventory() }),
        queryClient.invalidateQueries({ queryKey: adminKeys.products() }),
        // Availability is shown on product pages.
        queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
      ]);
    },
  });
}
