import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AppLink } from '@/components/AppLink';
import { ordersQuery } from '@/features/orders/api';
import { OrderListItem } from '@/features/orders/components/OrderListItem';
import { getErrorMessage } from '@/lib/errorMessage';
import { AccountSection } from './AccountSection';

const RECENT = 3;

/** Shares the cache entry of the first page of /orders, so opening it afterwards is instant. */
export function RecentOrders() {
  const { t } = useTranslation();
  const orders = useQuery(ordersQuery({ page: 1 }));
  return (
    <AccountSection title={t('profile.recentOrdersTitle')}>
      {orders.isPending ? (
        <Skeleton variant="rectangular" height={120} />
      ) : orders.isError ? (
        <Typography color="error">{getErrorMessage(orders.error, t)}</Typography>
      ) : orders.data.data.length === 0 ? (
        <Typography color="textSecondary">{t('profile.noOrders')}</Typography>
      ) : (
        <>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {orders.data.data.slice(0, RECENT).map((order) => (
              <OrderListItem key={order.id} order={order} compact />
            ))}
          </Box>
          <AppLink to="/orders" sx={{ display: 'inline-block', mt: 2, fontWeight: 600 }}>
            {t('profile.viewAllOrders')}
          </AppLink>
        </>
      )}
    </AccountSection>
  );
}
