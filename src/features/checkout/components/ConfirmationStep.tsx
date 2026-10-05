import CheckCircle from '@mui/icons-material/CheckCircleOutlineOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { OrderTotals } from '@/components/OrderTotals';
import { orderQuery } from '@/features/orders/api';
import { StepHeading } from './StepHeading';

export function ConfirmationStep({ orderId }: { orderId: string }) {
  const { t } = useTranslation();
  const order = useQuery(orderQuery(orderId));
  if (!order.data) return null;

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
