import ReceiptLong from '@mui/icons-material/ReceiptLongOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useSearchParams } from 'react-router';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LinkPagination } from '@/components/LinkPagination';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { getErrorMessage } from '@/lib/errorMessage';
import { ORDER_STATUSES, ordersQuery, parseOrderFilters } from '../api';
import { OrderListItem } from '../components/OrderListItem';

export function OrdersPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const filters = parseOrderFilters(params);
  const orders = useQuery(ordersQuery(filters));
  const meta = orders.data?.meta;

  const filterHref = (status?: string) => (status ? `/orders?status=${status}` : '/orders');

  return (
    <PageContainer>
      <Seo title={t('orders.title')} index={false} />
      <PageHeader
        title={t('orders.title')}
        description={t('orders.subtitle')}
        actions={
          meta && (
            <Typography color="textSecondary" role="status">
              {t('orders.count', { count: meta.total })}
            </Typography>
          )
        }
      />

      <Box
        component="nav"
        aria-label={t('orders.statusFilter')}
        sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}
      >
        {[undefined, ...ORDER_STATUSES].map((status) => {
          const selected = filters.status === status;
          return (
            <Chip
              key={status ?? 'all'}
              component={RouterLink}
              to={filterHref(status)}
              clickable
              label={status ? t(`orders.status.${status}`) : t('orders.allStatuses')}
              variant={selected ? 'filled' : 'outlined'}
              color={selected ? 'primary' : 'default'}
              aria-current={selected ? 'page' : undefined}
            />
          );
        })}
      </Box>

      {orders.isPending ? (
        <Paper variant="outlined" aria-busy="true" aria-label={t('common.loading')}>
          {Array.from({ length: 4 }, (_, i) => (
            <Box key={i} sx={{ px: 3, py: 2.5, borderTop: i ? 1 : 0, borderColor: 'divider' }}>
              <Skeleton width="30%" />
              <Skeleton width="20%" />
            </Box>
          ))}
        </Paper>
      ) : orders.isError ? (
        <ErrorState
          description={getErrorMessage(orders.error, t)}
          onRetry={() => void orders.refetch()}
        />
      ) : orders.data.data.length === 0 ? (
        <EmptyState
          icon={<ReceiptLong />}
          title={filters.status ? t('orders.emptyFiltered') : t('orders.empty')}
          description={filters.status ? t('orders.emptyFilteredBody') : t('orders.emptyBody')}
          action={
            filters.status ? (
              <Button component={RouterLink} to="/orders" variant="outlined">
                {t('orders.showAll')}
              </Button>
            ) : (
              <Button component={RouterLink} to="/products" variant="contained">
                {t('cart.continueShopping')}
              </Button>
            )
          }
        />
      ) : (
        <>
          <Paper
            variant="outlined"
            component="ul"
            sx={{ listStyle: 'none', m: 0, p: 0, opacity: orders.isPlaceholderData ? 0.6 : 1 }}
          >
            {orders.data.data.map((order) => (
              <OrderListItem key={order.id} order={order} />
            ))}
          </Paper>
          {meta && <LinkPagination page={meta.page} totalPages={meta.totalPages} />}
        </>
      )}
    </PageContainer>
  );
}
