import CheckCircle from '@mui/icons-material/CheckCircleOutlineOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Navigate, Link as RouterLink } from 'react-router';
import { ErrorState } from '@/components/ErrorState';
import { OrderTotals } from '@/components/OrderTotals';
import { isPaid, orderQuery } from '@/features/orders/api';
import { getErrorMessage } from '@/lib/errorMessage';
import { StepHeading } from './StepHeading';

export function ConfirmationStep({ orderId }: { orderId: string }) {
  const { t } = useTranslation();
  const order = useQuery(orderQuery(orderId));
  if (order.isPending) return <Skeleton variant="rectangular" height={240} />;
  if (order.isError) {
    return (
      <ErrorState
        headingLevel="h3"
        title={t('checkout.orderNotFound')}
        description={getErrorMessage(order.error, t)}
        onRetry={() => void order.refetch()}
      />
    );
  }
  // The URL alone must not show a success screen: unpaid orders go back to payment, and
  // anything else (e.g. cancelled) to the order's own page.
  if (order.data.status === 'PENDING') {
    return <Navigate to={`/checkout?step=payment&order=${orderId}`} replace />;
  }
  if (!isPaid(order.data.status)) return <Navigate to={`/orders/${orderId}`} replace />;

  return (
    <Box>
      <Box aria-hidden sx={{ color: 'success.main', '& svg': { fontSize: 48 }, mb: 1 }}>
        <CheckCircle />
      </Box>
      <StepHeading>{t('checkout.confirmationTitle')}</StepHeading>
      <Typography color="textSecondary" sx={{ mb: 3 }}>
        {t('checkout.confirmationBody', { number: order.data.orderNumber })}
      </Typography>
      <Box sx={{ maxWidth: 420, mb: 4 }}>
        <OrderTotals {...order.data} />
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button component={RouterLink} to={`/orders/${orderId}`} variant="contained">
          {t('checkout.viewOrder')}
        </Button>
        <Button component={RouterLink} to="/products">
          {t('cart.continueShopping')}
        </Button>
      </Stack>
    </Box>
  );
}
