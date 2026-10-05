import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { api, unwrap } from '@/api/client';
import type { OrderStatus, Payment } from '@/api/schema';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: { page: number; status?: OrderStatus }) =>
    [...orderKeys.lists(), filters] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
  payments: (id: string) => [...orderKeys.all, 'detail', id, 'payments'] as const,
  invoice: (id: string) => [...orderKeys.all, 'detail', id, 'invoice'] as const,
};

export const ORDERS_PAGE_SIZE = 10;

export function ordersQuery(filters: { page: number; status?: OrderStatus }) {
  return queryOptions({
    queryKey: orderKeys.list(filters),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/orders', {
          params: { query: { ...filters, pageSize: ORDERS_PAGE_SIZE } },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function orderQuery(id: string) {
  return queryOptions({
    queryKey: orderKeys.detail(id),
    queryFn: async () =>
      (await unwrap(api.GET('/api/v1/orders/{id}', { params: { path: { id } } }))).data,
  });
}

export function orderPaymentsQuery(id: string) {
  return queryOptions({
    queryKey: orderKeys.payments(id),
    queryFn: async () =>
      (await unwrap(api.GET('/api/v1/orders/{id}/payments', { params: { path: { id } } }))).data,
  });
}

/** Most recent payment attempt (the API lists newest first). */
export const latestPayment = (payments: Payment[] | undefined) => payments?.[0];

export function createOrder(addressId: string, idempotencyKey: string) {
  return unwrap(
    api.POST('/api/v1/orders', {
      body: { addressId },
      headers: { 'Idempotency-Key': idempotencyKey },
    }),
  ).then((r) => r.data);
}

export function createPayment(orderId: string, paymentMethod: string, idempotencyKey: string) {
  return unwrap(
    api.POST('/api/v1/payments', {
      body: { orderId, paymentMethod },
      // Required by the contract: the generated types make forgetting it a compile error.
      params: { header: { 'idempotency-key': idempotencyKey } },
    }),
  ).then((r) => r.data);
}
