import { queryOptions } from '@tanstack/react-query';
import { api, unwrap } from '@/api/client';
import type { OrderStatus } from '@/api/schema';
import { DEFAULT_LOW_STOCK_THRESHOLD } from './inventory';
import { adminKeys } from './keys';

/**
 * Dashboard figures are exact counts from the API's pagination meta (`total`), fetched with tiny
 * pages. Nothing is extrapolated or summed client-side.
 */
const key = (...parts: unknown[]) => [...adminKeys.dashboard(), ...parts];

export const latestOrdersQuery = queryOptions({
  queryKey: key('orders', 'latest'),
  queryFn: () => unwrap(api.GET('/api/v1/orders', { params: { query: { pageSize: 5 } } })),
});

export function orderCountQuery(status: OrderStatus) {
  return queryOptions({
    queryKey: key('orders', 'count', status),
    queryFn: async () =>
      (await unwrap(api.GET('/api/v1/orders', { params: { query: { status, pageSize: 1 } } }))).meta
        .total,
  });
}

export const lowStockQuery = queryOptions({
  queryKey: key('inventory', 'low'),
  queryFn: () =>
    unwrap(
      api.GET('/api/v1/inventory', {
        params: {
          query: { lowStock: 'true', threshold: DEFAULT_LOW_STOCK_THRESHOLD, pageSize: 5 },
        },
      }),
    ),
});

export const activeProductCountQuery = queryOptions({
  queryKey: key('products', 'active'),
  queryFn: async () =>
    (
      await unwrap(
        api.GET('/api/v1/products', { params: { query: { status: 'ACTIVE', pageSize: 1 } } }),
      )
    ).meta.total,
});

export const customerCountQuery = queryOptions({
  queryKey: key('users', 'customers'),
  queryFn: async () =>
    (
      await unwrap(
        api.GET('/api/v1/users', { params: { query: { role: 'CUSTOMER', pageSize: 1 } } }),
      )
    ).meta.total,
});
