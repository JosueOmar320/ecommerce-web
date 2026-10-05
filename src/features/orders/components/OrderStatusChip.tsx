import { useTranslation } from 'react-i18next';
import type { OrderStatus } from '@/api/schema';
import { StatusPill, type StatusTone } from '@/components/StatusPill';

export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'neutral',
};

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  return <StatusPill tone={ORDER_STATUS_TONE[status]}>{t(`orders.status.${status}`)}</StatusPill>;
}
