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

/** Every cart mutation returns the full, server-priced cart: write it to the cache as-is. */
function useCartMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<Cart>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.all, cart);
    },
  });
}

export function useAddToCart() {
  return useCartMutation(
    async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
      const cart = (await unwrap(api.POST('/api/v1/cart/items', { body: { variantId, quantity } })))
        .data;
      const line = cart.items.find((item) => item.variantId === variantId);
      if (line) rememberPrice(variantId, line.unitPriceCents);
      return cart;
    },
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

export function useRemoveCartItem() {
  return useCartMutation(
    async (itemId: string) =>
      (await unwrap(api.DELETE('/api/v1/cart/items/{id}', { params: { path: { id: itemId } } })))
        .data,
  );
}
