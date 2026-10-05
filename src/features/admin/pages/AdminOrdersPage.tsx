import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { OrderSummary } from '@/api/schema';
import { AppLink } from '@/components/AppLink';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { ORDER_STATUSES } from '@/features/orders/api';
import { OrderStatusChip } from '@/features/orders/components/OrderStatusChip';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { formatDateTime, formatMoney } from '@/lib/format';
import { adminOrderFiltersSchema, adminOrdersQuery } from '../api/orders';
import { DataTable, type Column } from '../components/DataTable';
import { FilterBar, FilterSelect } from '../components/FilterBar';
import { ListFooter } from '../components/ListFooter';

export function AdminOrdersPage() {
  const { t, i18n } = useTranslation();
  const { filters, update } = useUrlFilters(adminOrderFiltersSchema);
  const orders = useQuery(adminOrdersQuery(filters));

  const columns: Column<OrderSummary>[] = [
    {
      id: 'number',
      header: t('admin.orders.number'),
      cell: (order) => (
        <>
          <AppLink to={`/admin/orders/${order.id}`} sx={{ fontWeight: 650, whiteSpace: 'nowrap' }}>
            {order.orderNumber}
          </AppLink>
          {/* Phones: the total column is hidden, so it is shown here. */}
          <Typography variant="body2" color="textSecondary" sx={{ display: { sm: 'none' } }}>
            {formatMoney(order.totalCents, order.currency, i18n.language)}
          </Typography>
        </>
      ),
    },
    {
      id: 'customer',
      header: t('admin.orders.customer'),
      hideBelow: 'sm',
      cell: (order) => (
        <>
          <Typography variant="body2">
            {order.customer.firstName} {order.customer.lastName}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {order.customer.email}
          </Typography>
        </>
      ),
    },
    {
      id: 'status',
      header: t('admin.products.status'),
      cell: (order) => <OrderStatusChip status={order.status} />,
    },
    {
      id: 'items',
      header: t('admin.orders.items'),
      align: 'right',
      hideBelow: 'lg',
      cell: (order) => order.itemCount,
    },
    {
      id: 'total',
      header: t('admin.orders.total'),
      align: 'right',
      hideBelow: 'sm',
      cell: (order) => (
        <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {formatMoney(order.totalCents, order.currency, i18n.language)}
        </Typography>
      ),
    },
    {
      id: 'placed',
      header: t('admin.orders.placed'),
      hideBelow: 'md',
      cell: (order) => formatDateTime(order.createdAt, i18n.language),
    },
  ];

  return (
    <>
      <Seo title={t('admin.orders.title')} index={false} />
      <PageHeader title={t('admin.orders.title')} description={t('admin.orders.subtitle')} />
      {filters.userId && (
        <Alert
          severity="info"
          variant="outlined"
          sx={{ mb: 2 }}
          action={
            <Button
              size="small"
              onClick={() => {
                update({ userId: undefined });
              }}
            >
              {t('admin.orders.allCustomers')}
            </Button>
          }
        >
          {t('admin.orders.oneCustomer')}
        </Alert>
      )}
      <FilterBar>
        <FilterSelect
          label={t('admin.products.status')}
          value={filters.status ?? ''}
          onChange={(event) => {
            update({ status: ORDER_STATUSES.find((status) => status === event.target.value) });
          }}
        >
          <MenuItem value="">{t('admin.all')}</MenuItem>
          {ORDER_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {t(`orders.status.${status}`)}
            </MenuItem>
          ))}
        </FilterSelect>
      </FilterBar>
      <DataTable
        caption={t('admin.orders.caption')}
        columns={columns}
        rows={orders.data?.data}
        getRowId={(order) => order.id}
        isPending={orders.isPending}
        isFetching={orders.isPlaceholderData}
        error={orders.error}
        onRetry={() => void orders.refetch()}
        empty={
          <Typography color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
            {t('admin.orders.empty')}
          </Typography>
        }
      />
      <ListFooter meta={orders.data?.meta} />
    </>
  );
}
