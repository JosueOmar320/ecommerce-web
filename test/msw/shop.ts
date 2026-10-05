import type { Address, Cart, CartItem, Order, Payment } from '@/api/schema';
import { customer } from './fixtures';

export const homeAddress: Address = {
  id: 'a1000000-0000-4000-8000-000000000001',
  label: 'Home',
  recipientName: 'Carlos Customer',
  phone: null,
  line1: 'Av. Insurgentes Sur 1234',
  line2: null,
  city: 'Ciudad de México',
  state: 'CDMX',
  postalCode: '03100',
  country: 'MX',
  isDefault: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export function cartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'i1000000-0000-4000-8000-000000000001',
    variantId: 'v1000000-0000-4000-8000-000000000001',
    productId: 'p1000000-0000-4000-8000-000000000001',
    productName: 'Nimbus X Phone',
    productSlug: 'nimbus-x-phone',
    variantName: 'Black / 128GB',
    sku: 'NBX-BLACK-128',
    attributes: { color: 'Black', storage: '128GB' },
    unitPriceCents: 79_900,
    quantity: 1,
    lineTotalCents: 79_900,
    availableQuantity: 5,
    issue: null,
    ...overrides,
  };
}

/** A cart priced like the API does (8% tax, free shipping above $100). */
export function cartWith(items: CartItem[]): Cart {
  const subtotalCents = items.reduce((sum, i) => sum + i.lineTotalCents, 0);
  const shippingCents = subtotalCents === 0 || subtotalCents >= 10_000 ? 0 : 999;
  const taxCents = Math.round(subtotalCents * 0.08);
  return {
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    currency: 'USD',
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
    isCheckoutReady: items.length > 0 && items.every((i) => i.issue === null),
  };
}

export function orderFrom(cart: Cart, overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1000000-0000-4000-8000-000000000001',
    orderNumber: 'ORD-00001234',
    status: 'PENDING',
    currency: cart.currency,
    subtotalCents: cart.subtotalCents,
    shippingCents: cart.shippingCents,
    taxCents: cart.taxCents,
    totalCents: cart.totalCents,
    itemCount: cart.itemCount,
    customer: {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
    },
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
    shippingAddress: {
      recipientName: homeAddress.recipientName,
      phone: null,
      line1: homeAddress.line1,
      line2: null,
      city: homeAddress.city,
      state: homeAddress.state,
      postalCode: homeAddress.postalCode,
      country: homeAddress.country,
    },
    items: cart.items.map((i) => ({
      id: `oi-${i.id}`,
      variantId: i.variantId,
      productId: i.productId,
      sku: i.sku,
      productName: i.productName,
      variantName: i.variantName,
      attributes: i.attributes,
      unitPriceCents: i.unitPriceCents,
      quantity: i.quantity,
      lineTotalCents: i.lineTotalCents,
    })),
    statusHistory: [
      {
        fromStatus: null,
        toStatus: 'PENDING',
        reason: null,
        changedBy: customer.id,
        createdAt: '2026-03-01T10:00:00.000Z',
      },
    ],
    cancelledAt: null,
    cancellationReason: null,
    expiresAt: '2026-03-01T10:30:00.000Z',
    allowedTransitions: ['CANCELLED'],
    ...overrides,
  };
}

export function payment(order: Order, overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'pay10000-0000-4000-8000-000000000001',
    orderId: order.id,
    provider: 'mock',
    status: 'PENDING',
    amountCents: order.totalCents,
    currency: order.currency,
    failureReason: null,
    createdAt: '2026-03-01T10:01:00.000Z',
    completedAt: null,
    refundedAt: null,
    ...overrides,
  };
}
