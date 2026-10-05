import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/api/client';
import type { ProductSummary, WishlistItem } from '@/api/schema';

export const wishlistKeys = { all: ['wishlist'] as const };

export const wishlistQuery = queryOptions({
  queryKey: wishlistKeys.all,
  queryFn: async () => (await unwrap(api.GET('/api/v1/wishlist'))).data,
});

/** `product` is only needed to render an optimistic entry when adding. */
type ToggleVariables =
  { productId: string; saved: true } | { productId: string; saved: false; product: ProductSummary };

const removeItem = async (productId: string) =>
  (
    await unwrap(
      api.DELETE('/api/v1/wishlist/items/{productId}', { params: { path: { productId } } }),
    )
  ).data;

const addItem = async (productId: string) =>
  (await unwrap(api.POST('/api/v1/wishlist/items', { body: { productId } }))).data;

/**
 * Optimistic toggle: the heart flips immediately, the server's answer (the full list) replaces the
 * optimistic state, and a failure restores the previous list. Both endpoints are idempotent, so a
 * double click cannot leave the list inconsistent.
 */
export function useToggleWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: ToggleVariables) =>
      variables.saved ? removeItem(variables.productId) : addItem(variables.productId),
    // One toggle at a time, so responses (and rollbacks) cannot apply out of order.
    scope: { id: 'wishlist' },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.all });
      const previous = queryClient.getQueryData<WishlistItem[]>(wishlistKeys.all);
      queryClient.setQueryData<WishlistItem[]>(wishlistKeys.all, (items = []) =>
        variables.saved
          ? items.filter((item) => item.productId !== variables.productId)
          : [
              {
                productId: variables.productId,
                addedAt: new Date().toISOString(),
                product: variables.product,
              },
              ...items,
            ],
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(wishlistKeys.all, context?.previous);
      // The snapshot may predate other saved items: resync with the server.
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
    onSuccess: (items) => {
      queryClient.setQueryData(wishlistKeys.all, items);
    },
  });
}
