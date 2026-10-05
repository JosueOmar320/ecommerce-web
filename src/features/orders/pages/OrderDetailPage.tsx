import ArrowBack from '@mui/icons-material/ArrowBackOutlined';
import ReceiptLong from '@mui/icons-material/ReceiptLongOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams } from 'react-router';
import type { Order } from '@/api/schema';
import { ApiError } from '@/api/errors';
import { AppLink } from '@/components/AppLink';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OrderTotals } from '@/components/OrderTotals';
import { PageContainer } from '@/components/PageContainer';
import { Seo } from '@/components/Seo';
import { formatAddress } from '@/features/account/formatAddress';
import { getErrorMessage } from '@/lib/errorMessage';
import { formatDateTime } from '@/lib/format';
import { invoiceQuery, isPaid, orderPaymentsQuery, orderQuery } from '../api';
import { CancelOrderDialog } from '../components/CancelOrderDialog';
import { InvoiceDialog } from '../components/InvoiceDialog';
import { OrderItems } from '../components/OrderItems';
import { OrderProgress } from '../components/OrderProgress';
import { OrderStatusChip } from '../components/OrderStatusChip';
import { PaymentAttempts } from '../components/PaymentAttempts';
import { StatusHistory } from '../components/StatusHistory';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" component="section" sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

export function OrderDetailPage() {
  const { t } = useTranslation();
  const { orderId = '' } = useParams();
  const order = useQuery(orderQuery(orderId));

  const back = (
    <AppLink
      to="/orders"
      underline="hover"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        mb: 2,
        color: 'text.secondary',
      }}
    >
      <ArrowBack fontSize="small" aria-hidden />
      {t('orders.backToOrders')}
    </AppLink>
  );

  if (order.isPending) {
    return (
      <PageContainer aria-busy="true">
        {back}
        <Skeleton variant="text" width={280} height={48} />
        <Skeleton variant="rectangular" height={360} sx={{ mt: 3 }} />
      </PageContainer>
    );
  }

  if (order.isError) {
    // 400 (malformed id) and 404 (missing or someone else's) mean the same thing to a customer.
    const missing =
      order.error instanceof ApiError && (order.error.status === 404 || order.error.status === 400);
    return (
      <PageContainer>
        <Seo title={t('orders.notFound')} index={false} />
        {back}
        {missing ? (
          <EmptyState
            headingLevel="h2"
            icon={<ReceiptLong />}
            title={t('orders.notFound')}
            description={t('orders.notFoundBody')}
          />
        ) : (
          <ErrorState
            description={getErrorMessage(order.error, t)}
            onRetry={() => void order.refetch()}
          />
        )}
      </PageContainer>
    );
  }

  return <OrderDetail order={order.data} back={back} />;
}

function OrderDetail({ order, back }: { order: Order; back: ReactNode }) {
  const { t, i18n } = useTranslation();
  const payments = useQuery(orderPaymentsQuery(order.id));
  const invoice = useQuery(invoiceQuery(order));
  const [cancelOpen, setCancelOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const canCancel = order.allowedTransitions.includes('CANCELLED');
  const title = t('orders.detailTitle', { number: order.orderNumber });

  return (
    <PageContainer>
      <Seo title={title} index={false} />
      {back}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' }, mb: 3 }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography
              ref={headingRef}
              tabIndex={-1}
              variant="h3"
              component="h1"
              sx={{ '&:focus': { outline: 'none' } }}
            >
              {title}
            </Typography>
            <OrderStatusChip status={order.status} />
          </Stack>
          <Typography color="textSecondary" sx={{ mt: 0.5 }}>
            {t('orders.placedOn', { date: formatDateTime(order.createdAt, i18n.language) })}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {canCancel && (
            <Button
              color="error"
              onClick={() => {
                setCancelOpen(true);
              }}
            >
              {t('orders.cancel')}
            </Button>
          )}
          {order.status === 'PENDING' && (
            <Button
              component={RouterLink}
              to={`/checkout?step=payment&order=${order.id}`}
              variant="contained"
            >
              {t('orders.payNow')}
            </Button>
          )}
        </Stack>
      </Stack>

      {order.status === 'PENDING' && order.expiresAt && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 3 }}>
          {t('orders.payBefore', { time: formatDateTime(order.expiresAt, i18n.language) })}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <OrderProgress order={order} />
      </Paper>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Stack spacing={3}>
            <Section title={t('orders.items')}>
              <OrderItems items={order.items} currency={order.currency} />
            </Section>
            <Section title={t('orders.payments')}>
              {payments.isPending ? (
                <Skeleton height={48} />
              ) : payments.isError ? (
                <Typography color="error">{getErrorMessage(payments.error, t)}</Typography>
              ) : (
                <PaymentAttempts payments={payments.data} />
              )}
            </Section>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Stack spacing={3}>
            <Section title={t('orders.summary')}>
              <OrderTotals {...order} />
            </Section>
            <Section title={t('orders.shippingAddress')}>
              <Typography sx={{ fontWeight: 600 }}>
                {order.shippingAddress.recipientName}
              </Typography>
              <Typography color="textSecondary">{formatAddress(order.shippingAddress)}</Typography>
              {order.shippingAddress.phone && (
                <Typography color="textSecondary">{order.shippingAddress.phone}</Typography>
              )}
            </Section>
            {order.status !== 'PENDING' && (invoice.data || isPaid(order.status)) && (
              <Section title={t('orders.invoice')}>
                {invoice.data ? (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<ReceiptLong />}
                      onClick={() => {
                        setInvoiceOpen(true);
                      }}
                    >
                      {t('orders.viewInvoice', { number: invoice.data.invoiceNumber })}
                    </Button>
                    <InvoiceDialog
                      invoice={invoice.data}
                      open={invoiceOpen}
                      onClose={() => {
                        setInvoiceOpen(false);
                      }}
                    />
                  </>
                ) : invoice.isError ? (
                  <Typography color="error">{getErrorMessage(invoice.error, t)}</Typography>
                ) : (
                  <Typography color="textSecondary" role="status">
                    {invoice.isPending ? t('common.loading') : t('orders.invoicePending')}
                  </Typography>
                )}
              </Section>
            )}
            <Section title={t('orders.history')}>
              <StatusHistory history={order.statusHistory} />
            </Section>
          </Stack>
        </Grid>
      </Grid>

      {/* Kept mounted after the order turns CANCELLED, so its success callback still runs. */}
      <CancelOrderDialog
        order={order}
        open={cancelOpen}
        onClose={() => {
          setCancelOpen(false);
        }}
        onExited={() => {
          // The "Cancel order" button is gone once cancelled: continue from the page heading.
          if (!order.allowedTransitions.includes('CANCELLED')) headingRef.current?.focus();
        }}
      />
    </PageContainer>
  );
}
