import { readStorage, writeStorage } from '@/lib/storage';

/**
 * The API does not store the price a line was added at (the cart is always priced live). To tell
 * shoppers when a price changed since they added an item, the browser remembers the price it last
 * showed for each variant. Purely informational: the server price is always the one charged.
 */
const KEY = 'kestrel.cart-prices';

function read(): Record<string, number> {
  try {
    return JSON.parse(readStorage(KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

export function rememberPrice(variantId: string, unitPriceCents: number) {
  writeStorage(KEY, JSON.stringify({ ...read(), [variantId]: unitPriceCents }));
}

export function rememberedPrice(variantId: string): number | undefined {
  return read()[variantId];
}

export function forgetPrices(keepVariantIds: string[]) {
  const prices = read();
  writeStorage(
    KEY,
    JSON.stringify(
      Object.fromEntries(Object.entries(prices).filter(([id]) => keepVariantIds.includes(id))),
    ),
  );
}
