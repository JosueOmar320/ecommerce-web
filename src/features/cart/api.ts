import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/api/client';
import type { Cart } from '@/api/schema';
import { rememberPrice } from './priceMemory';

export const cartKeys = { all: ['cart'] as const };

export const cartQuery = queryOptions({
  queryKey: cartKeys.all,
  queryFn: async () => (await unwrap(api.GET('/api/v1/cart'))).data,
  // Prices and stock can change at any time: refresh whenever the cart is shown again.
  staleTime: 0,
});

interface CartMutationOptions {
  /**
   * Runs even if the calling component unmounts first (unlike callbacks passed to `mutate`),
   * e.g. when the product page swaps its purchase panel for another variant.
   */
  onSuccess?: (cart: Cart) => void;
}

/** Every cart mutation returns the full, server-priced cart: write it to the cache as-is. */
function useCartMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<Cart>,
  options: CartMutationOptions = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    // Cart mutations run one at a time: each response is the full cart, so an older response
    // arriving after a newer one would otherwise overwrite fresher data.
    scope: { id: 'cart' },
    // Same for reads: a GET started before the mutation must not land after its result.
    onMutate: () => queryClient.cancelQueries({ queryKey: cartKeys.all }),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.all, cart);
      options.onSuccess?.(cart);
    },
  });
}

export function useAddToCart(options?: CartMutationOptions) {
  return useCartMutation(
    async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
      const cart = (await unwrap(api.POST('/api/v1/cart/items', { body: { variantId, quantity } })))
        .data;
      const line = cart.items.find((item) => item.variantId === variantId);
      if (line) rememberPrice(variantId, line.unitPriceCents);
      return cart;
    },
    options,
  );
}

export function useUpdateCartItem() {
  return useCartMutation(
    async ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      (
        await unwrap(
          api.PATCH('/api/v1/cart/items/{id}', {
            params: { path: { id: itemId } },
            body: { quantity },
          }),
        )
      ).data,
  );
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await unwrap(api.DELETE('/api/v1/cart'));
    },
    scope: { id: 'cart' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useRemoveCartItem() {
  return useCartMutation(
    async (itemId: string) =>
      (await unwrap(api.DELETE('/api/v1/cart/items/{id}', { params: { path: { id: itemId } } })))
        .data,
  );
}
