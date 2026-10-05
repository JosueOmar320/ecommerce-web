import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, unwrap } from '@/api/client';
import type { OrderStatus } from '@/api/schema';
import { ORDER_STATUSES, orderKeys } from '@/features/orders/api';
import { ADMIN_PAGE_SIZE, adminKeys } from './keys';

export const adminOrderFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  status: z.enum(ORDER_STATUSES).optional().catch(undefined),
  userId: z.uuid().optional().catch(undefined),
});
export type AdminOrderFilters = z.output<typeof adminOrderFiltersSchema>;

/** With `orders:read` the same endpoint lists every customer's orders. */
export function adminOrdersQuery(filters: AdminOrderFilters) {
  return queryOptions({
    queryKey: adminKeys.orderList(filters),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/api/v1/orders', {
          params: { query: { ...filters, pageSize: ADMIN_PAGE_SIZE } },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useChangeOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: OrderStatus;
      reason?: string;
    }) =>
      (
        await unwrap(
          api.PATCH('/api/v1/orders/{id}/status', {
            params: { path: { id } },
            body: { status, ...(reason && { reason }) },
          }),
        )
      ).data,
    onSuccess: async (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.orders() }),
        queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() }),
        // Cancelling refunds a paid order and releases stock.
        queryClient.invalidateQueries({ queryKey: orderKeys.payments(order.id) }),
        queryClient.invalidateQueries({ queryKey: adminKeys.inventory() }),
      ]);
    },
  });
}

/** Retries a refund that failed; the order must already be CANCELLED (idempotent). */
export function useRefundPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: { id: string; orderId: string }) =>
      (
        await unwrap(
          api.POST('/api/v1/payments/{id}/refund', { params: { path: { id: payment.id } } }),
        )
      ).data,
    onSuccess: (_data, payment) =>
      queryClient.invalidateQueries({ queryKey: orderKeys.payments(payment.orderId) }),
  });
}
