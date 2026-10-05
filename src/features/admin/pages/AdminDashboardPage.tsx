import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLink } from '@/components/AppLink';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { ADMIN_SECTION_PERMISSION } from '@/features/auth/permissions';
import { useSession } from '@/features/auth/session';
import { OrderStatusChip } from '@/features/orders/components/OrderStatusChip';
import { getErrorMessage } from '@/lib/errorMessage';
import { formatDate, formatMoney } from '@/lib/format';
import {
  activeProductCountQuery,
  customerCountQuery,
  latestOrdersQuery,
  lowStockQuery,
  orderCountQuery,
} from '../api/dashboard';
import { DEFAULT_LOW_STOCK_THRESHOLD } from '../api/inventory';
import { MetricCard } from '../components/MetricCard';

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper variant="outlined" component="section" sx={{ p: { xs: 2, sm: 2.5 }, height: '100%' }}>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}
      >
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </Paper>
  );
}

const rowSx = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 2,
  py: 1.25,
  '& + &': { borderTop: 1, borderColor: 'divider' },
} as const;

export function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useSession();
  const can = {
    orders: hasPermission(ADMIN_SECTION_PERMISSION.orders),
    inventory: hasPermission(ADMIN_SECTION_PERMISSION.inventory),
    products: hasPermission(ADMIN_SECTION_PERMISSION.products),
    users: hasPermission(ADMIN_SECTION_PERMISSION.users),
  };

  const latest = useQuery({ ...latestOrdersQuery, enabled: can.orders });
  const pending = useQuery({ ...orderCountQuery('PENDING'), enabled: can.orders });
  const confirmed = useQuery({ ...orderCountQuery('CONFIRMED'), enabled: can.orders });
  const lowStock = useQuery({ ...lowStockQuery, enabled: can.inventory });
  const products = useQuery({ ...activeProductCountQuery, enabled: can.products });
  const customers = useQuery({ ...customerCountQuery, enabled: can.users });

  return (
    <>
      <Seo title={t('admin.dashboard.title')} index={false} />
      <PageHeader title={t('admin.dashboard.title')} description={t('admin.dashboard.subtitle')} />

      <Box
        component="ul"
        aria-label={t('admin.dashboard.metrics')}
        sx={{
          m: 0,
          p: 0,
          mb: 3,
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        }}
      >
        {can.orders && (
          <>
            <MetricCard
              label={t('admin.dashboard.ordersTotal')}
              value={latest.data?.meta.total}
              isError={latest.isError}
              hint={t('admin.dashboard.ordersTotalHint')}
              to="/admin/orders"
            />
            <MetricCard
              label={t('admin.dashboard.awaitingPayment')}
              value={pending.data}
              isError={pending.isError}
              hint={t('admin.dashboard.awaitingPaymentHint')}
              to="/admin/orders?status=PENDING"
            />
            <MetricCard
              label={t('admin.dashboard.toFulfil')}
              value={confirmed.data}
              isError={confirmed.isError}
              hint={t('admin.dashboard.toFulfilHint')}
              to="/admin/orders?status=CONFIRMED"
            />
          </>
        )}
        {can.inventory && (
          <MetricCard
            label={t('admin.dashboard.lowStock')}
            value={lowStock.data?.meta.total}
            isError={lowStock.isError}
            hint={t('admin.dashboard.lowStockHint', { threshold: DEFAULT_LOW_STOCK_THRESHOLD })}
            to={`/admin/inventory?lowStock=true&threshold=${DEFAULT_LOW_STOCK_THRESHOLD}`}
          />
        )}
        {can.products && (
          <MetricCard
            label={t('admin.dashboard.activeProducts')}
            value={products.data}
            isError={products.isError}
            hint={t('admin.dashboard.activeProductsHint')}
            to="/admin/products?status=ACTIVE"
          />
        )}
        {can.users && (
          <MetricCard
            label={t('admin.dashboard.customers')}
            value={customers.data}
            isError={customers.isError}
            hint={t('admin.dashboard.customersHint')}
            to="/admin/users?role=CUSTOMER"
          />
        )}
      </Box>

      <Grid container spacing={2}>
        {can.orders && (
          <Grid size={{ xs: 12, lg: 7 }}>
            <Panel
              title={t('admin.dashboard.latestOrders')}
              action={<AppLink to="/admin/orders">{t('admin.dashboard.viewAll')}</AppLink>}
            >
              {latest.isPending ? (
                <Skeleton variant="rectangular" height={200} />
              ) : latest.isError ? (
                <Typography color="error">{getErrorMessage(latest.error, t)}</Typography>
              ) : latest.data.data.length === 0 ? (
                <Typography color="textSecondary">{t('admin.dashboard.noOrders')}</Typography>
              ) : (
                <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                  {latest.data.data.map((order) => (
                    <Box component="li" key={order.id} sx={rowSx}>
                      <Box sx={{ minWidth: 0 }}>
                        <AppLink to={`/admin/orders/${order.id}`} sx={{ fontWeight: 650 }}>
                          {order.orderNumber}
                        </AppLink>
                        <Typography variant="body2" color="textSecondary" noWrap>
                          {order.customer.firstName} {order.customer.lastName} ·{' '}
                          {formatDate(order.createdAt, i18n.language)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <OrderStatusChip status={order.status} />
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontVariantNumeric: 'tabular-nums',
                            minWidth: 96,
                            textAlign: 'right',
                            display: { xs: 'none', sm: 'block' },
                          }}
                        >
                          {formatMoney(order.totalCents, order.currency, i18n.language)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Panel>
          </Grid>
        )}
        {can.inventory && (
          <Grid size={{ xs: 12, lg: 5 }}>
            <Panel
              title={t('admin.dashboard.runningLow')}
              action={
                <AppLink
                  to={`/admin/inventory?lowStock=true&threshold=${DEFAULT_LOW_STOCK_THRESHOLD}`}
                >
                  {t('admin.dashboard.viewAll')}
                </AppLink>
              }
            >
              {lowStock.isPending ? (
                <Skeleton variant="rectangular" height={200} />
              ) : lowStock.isError ? (
                <Typography color="error">{getErrorMessage(lowStock.error, t)}</Typography>
              ) : lowStock.data.data.length === 0 ? (
                <Typography color="textSecondary">{t('admin.dashboard.noLowStock')}</Typography>
              ) : (
                <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                  {lowStock.data.data.map((level) => (
                    <Box component="li" key={level.variantId} sx={rowSx}>
                      <Box sx={{ minWidth: 0 }}>
                        <AppLink
                          to={`/admin/inventory?variant=${level.variantId}`}
                          sx={{ fontWeight: 600 }}
                        >
                          {level.productName}
                        </AppLink>
                        <Typography variant="body2" color="textSecondary" noWrap>
                          {level.variantName} · {level.sku}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                        color={level.available === 0 ? 'error' : 'textPrimary'}
                      >
                        {t('admin.inventory.available')}: {level.available}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Panel>
          </Grid>
        )}
      </Grid>

      <Typography variant="body2" color="textSecondary" sx={{ mt: 3, maxWidth: 720 }}>
        {t('admin.dashboard.revenueNote')}
      </Typography>
    </>
  );
}
