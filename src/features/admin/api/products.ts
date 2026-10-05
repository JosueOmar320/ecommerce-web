import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, unwrap } from '@/api/client';
import type {
  CreateProductRequest,
  CreateVariantRequest,
  UpdateProductRequest,
  UpdateVariantRequest,
} from '@/api/schema';
import { catalogKeys } from '@/features/catalog/api';
import { ADMIN_PAGE_SIZE, adminKeys } from './keys';

export const PRODUCT_STATUSES = ['ACTIVE', 'DRAFT', 'ARCHIVED'] as const;

export const productFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().min(1).max(200).optional().catch(undefined),
  // The API lists one status at a time (ACTIVE by default); there is no "all".
  status: z.enum(PRODUCT_STATUSES).catch('ACTIVE'),
  category: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional()
    .catch(undefined),
});
export type AdminProductFilters = z.output<typeof productFiltersSchema>;

/** Same endpoint as the storefront; with `products:read` it also returns drafts and archived. */
export function adminProductsQuery(filters: AdminProductFilters) {
  return queryOptions({
    queryKey: adminKeys.productList(filters),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/api/v1/products', {
          params: { query: { ...filters, pageSize: ADMIN_PAGE_SIZE, sort: 'newest' } },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function adminProductQuery(id: string) {
  return queryOptions({
    queryKey: adminKeys.product(id),
    queryFn: async () =>
      (await unwrap(api.GET('/api/v1/products/{idOrSlug}', { params: { path: { idOrSlug: id } } })))
        .data,
  });
}

/** Admin writes also change what shoppers see: storefront caches are refreshed too. */
function useProductMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.products() }),
        queryClient.invalidateQueries({ queryKey: adminKeys.inventory() }),
        queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
      ]);
    },
  });
}

export const useCreateProduct = () =>
  useProductMutation(
    async (body: CreateProductRequest) =>
      (await unwrap(api.POST('/api/v1/products', { body }))).data,
  );

export const useUpdateProduct = () =>
  useProductMutation(
    async ({ id, body }: { id: string; body: UpdateProductRequest }) =>
      (await unwrap(api.PATCH('/api/v1/products/{id}', { params: { path: { id } }, body }))).data,
  );

/**
 * Marks caches stale without refetching: the open editor's product is gone (a refetch would 404
 * and unmount the editor before it can navigate away). Lists refetch when they are next shown.
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await unwrap(api.DELETE('/api/v1/products/{id}', { params: { path: { id } } }));
    },
    onSuccess: () => {
      for (const queryKey of [adminKeys.products(), adminKeys.inventory(), catalogKeys.all]) {
        void queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
      }
    },
  });
}

export const useCreateVariant = () =>
  useProductMutation(
    async ({ productId, body }: { productId: string; body: CreateVariantRequest }) =>
      (
        await unwrap(
          api.POST('/api/v1/products/{id}/variants', { params: { path: { id: productId } }, body }),
        )
      ).data,
  );

export const useUpdateVariant = () =>
  useProductMutation(
    async ({
      productId,
      variantId,
      body,
    }: {
      productId: string;
      variantId: string;
      body: UpdateVariantRequest;
    }) =>
      (
        await unwrap(
          api.PATCH('/api/v1/products/{id}/variants/{variantId}', {
            params: { path: { id: productId, variantId } },
            body,
          }),
        )
      ).data,
  );

export const useDeleteVariant = () =>
  useProductMutation(async ({ productId, variantId }: { productId: string; variantId: string }) => {
    await unwrap(
      api.DELETE('/api/v1/products/{id}/variants/{variantId}', {
        params: { path: { id: productId, variantId } },
      }),
    );
  });
