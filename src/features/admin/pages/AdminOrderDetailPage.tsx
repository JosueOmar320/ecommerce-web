import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { ApiError } from '@/api/errors';
import type { Order, OrderStatus } from '@/api/schema';
import { AppLink } from '@/components/AppLink';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useNotify } from '@/components/Notifications';
import { OrderTotals } from '@/components/OrderTotals';
import { SectionCard } from '@/components/SectionCard';
import { Seo } from '@/components/Seo';
import { formatAddress } from '@/features/account/formatAddress';
import { useSession } from '@/features/auth/session';
import { orderPaymentsQuery, orderQuery } from '@/features/orders/api';
import { OrderItems } from '@/features/orders/components/OrderItems';
import { OrderProgress } from '@/features/orders/components/OrderProgress';
import { OrderStatusChip } from '@/features/orders/components/OrderStatusChip';
import { PaymentAttempts } from '@/features/orders/components/PaymentAttempts';
import { StatusHistory } from '@/features/orders/components/StatusHistory';
import { getErrorMessage } from '@/lib/errorMessage';
import { formatDateTime } from '@/lib/format';
import { useRefundPayment } from '../api/orders';
import { BackLink } from '../components/BackLink';
import { StatusTransitionDialog } from '../components/StatusTransitionDialog';

export function AdminOrderDetailPage() {
  const { t } = useTranslation();
  const { orderId = '' } = useParams();
  const order = useQuery(orderQuery(orderId));

  if (order.isPending) {
    return (
      <Box aria-busy="true">
        <Skeleton width={320} height={48} />
        <Skeleton variant="rectangular" height={420} sx={{ mt: 3 }} />
      </Box>
    );
  }
  if (order.isError) {
    const missing = order.error instanceof ApiError && [400, 404].includes(order.error.status);
    return (
      <>
        <BackLink to="/admin/orders">{t('admin.orders.back')}</BackLink>
        {missing ? (
          <EmptyState title={t('orders.notFound')} />
        ) : (
          <ErrorState
            description={getErrorMessage(order.error, t)}
            onRetry={() => void order.refetch()}
          />
        )}
      </>
    );
  }
  return <AdminOrderDetail order={order.data} />;
}

function AdminOrderDetail({ order }: { order: Order }) {
  const { t, i18n } = useTranslation();
  const notify = useNotify();
  const { hasPermission } = useSession();
  const payments = useQuery(orderPaymentsQuery(order.id));
  const refund = useRefundPayment();
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const title = t('orders.detailTitle', { number: order.orderNumber });
  const canUpdate = hasPermission('orders:update');
  // A cancelled order whose captured payment was not refunded (the automatic refund failed).
  const refundable =
    order.status === 'CANCELLED' && payments.data?.find((p) => p.status === 'COMPLETED');

  return (
    <>
      <Seo title={title} index={false} />
      <BackLink to="/admin/orders">{t('admin.orders.back')}</BackLink>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-start' }, mb: 3 }}
      >
        <div>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}
          >
            <Typography variant="h3" component="h1">
              {title}
            </Typography>
            <OrderStatusChip status={order.status} />
          </Stack>
          <Typography color="textSecondary">
            {t('orders.placedOn', { date: formatDateTime(order.createdAt, i18n.language) })}
          </Typography>
        </div>
        {/* Only the transitions the API allows from the current status. */}
        {canUpdate && order.allowedTransitions.length > 0 && (
          <Stack
            role="group"
            aria-label={t('admin.orders.updateStatus')}
            direction="row"
            spacing={1}
            sx={{ flexWrap: 'wrap' }}
          >
            {order.allowedTransitions.map((status) => (
              <Button
                key={status}
                variant={status === 'CANCELLED' ? 'outlined' : 'contained'}
                color={status === 'CANCELLED' ? 'error' : 'primary'}
                onClick={() => {
                  setTarget(status);
                }}
              >
                {t(`admin.orders.transitions.${status}`)}
              </Button>
            ))}
          </Stack>
        )}
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <SectionCard title={t('orders.progress')}>
              <OrderProgress order={order} />
            </SectionCard>
            <SectionCard title={t('orders.items')}>
              <OrderItems items={order.items} currency={order.currency} />
            </SectionCard>
            <SectionCard title={t('orders.payments')}>
              {payments.isPending ? (
                <Skeleton height={48} />
              ) : payments.isError ? (
                <Typography color="error">{getErrorMessage(payments.error, t)}</Typography>
              ) : (
                <PaymentAttempts payments={payments.data} />
              )}
              {refundable && hasPermission('payments:refund') && (
                <Alert
                  severity="warning"
                  variant="outlined"
                  sx={{ mt: 2 }}
                  action={
                    <Button
                      size="small"
                      disabled={refund.isPending}
                      onClick={() => {
                        refund.mutate(refundable, {
                          onSuccess: () => {
                            notify({ message: t('admin.orders.refundRequested') });
                          },
                          onError: (error) => {
                            notify({ message: getErrorMessage(error, t), severity: 'error' });
                          },
                        });
                      }}
                    >
                      {t('admin.orders.retryRefund')}
                    </Button>
                  }
                >
                  {t('admin.orders.refundHint')}
                </Alert>
              )}
            </SectionCard>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <SectionCard title={t('admin.orders.customer')}>
              <Typography sx={{ fontWeight: 600 }}>
                {order.customer.firstName} {order.customer.lastName}
              </Typography>
              <Typography color="textSecondary">{order.customer.email}</Typography>
              <AppLink
                to={`/admin/orders?userId=${order.customer.id}`}
                sx={{ display: 'inline-block', mt: 1 }}
              >
                {t('admin.orders.customerOrders')}
              </AppLink>
            </SectionCard>
            <SectionCard title={t('orders.summary')}>
              <OrderTotals {...order} />
            </SectionCard>
            <SectionCard title={t('orders.shippingAddress')}>
              <Typography sx={{ fontWeight: 600 }}>
                {order.shippingAddress.recipientName}
              </Typography>
              <Typography color="textSecondary">{formatAddress(order.shippingAddress)}</Typography>
              {order.shippingAddress.phone && (
                <Typography color="textSecondary">{order.shippingAddress.phone}</Typography>
              )}
            </SectionCard>
            <SectionCard title={t('orders.history')}>
              <StatusHistory history={order.statusHistory} />
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>

      <StatusTransitionDialog
        order={order}
        target={target}
        onClose={() => {
          setTarget(null);
        }}
      />
    </>
  );
}
