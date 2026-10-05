import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { InventoryLevel } from '@/api/schema';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { formatDateTime } from '@/lib/format';
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  inventoryFiltersSchema,
  inventoryQuery,
} from '../api/inventory';
import { DataTable, type Column } from '../components/DataTable';
import { FilterBar } from '../components/FilterBar';
import { ListFooter } from '../components/ListFooter';
import { StockDrawer } from '../components/StockDrawer';

export function AdminInventoryPage() {
  const { t, i18n } = useTranslation();
  const { filters, update } = useUrlFilters(inventoryFiltersSchema);
  const levels = useQuery(inventoryQuery(filters));
  const threshold = filters.threshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
  // Opening the drawer keeps the current page; it is part of the URL so it can be linked to.
  const openVariant = (variant: string | undefined) => {
    update({ variant, page: filters.page });
  };

  const number = (value: number) => (
    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </Typography>
  );

  const columns: Column<InventoryLevel>[] = [
    {
      id: 'product',
      header: t('admin.inventory.product'),
      cell: (level) => (
        <>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {level.productName}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {level.variantName}
          </Typography>
        </>
      ),
    },
    {
      id: 'sku',
      header: t('admin.inventory.sku'),
      hideBelow: 'md',
      cell: (level) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{level.sku}</Typography>
      ),
    },
    {
      id: 'onHand',
      header: t('admin.inventory.onHand'),
      align: 'right',
      hideBelow: 'sm',
      cell: (level) => number(level.onHand),
    },
    {
      id: 'reserved',
      header: t('admin.inventory.reserved'),
      align: 'right',
      hideBelow: 'sm',
      cell: (level) => number(level.reserved),
    },
    {
      id: 'available',
      header: t('admin.inventory.available'),
      align: 'right',
      cell: (level) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
          color={
            level.available === 0
              ? 'error'
              : level.available <= threshold
                ? 'warning'
                : 'textPrimary'
          }
        >
          {level.available}
        </Typography>
      ),
    },
    {
      id: 'updated',
      header: t('admin.inventory.updated'),
      hideBelow: 'lg',
      cell: (level) => formatDateTime(level.updatedAt, i18n.language),
    },
    {
      id: 'actions',
      header: <span>{t('admin.actions')}</span>,
      align: 'right',
      cell: (level) => (
        <Button
          size="small"
          aria-label={t('admin.inventory.historyFor', { sku: level.sku })}
          onClick={() => {
            openVariant(level.variantId);
          }}
        >
          {t('admin.inventory.history')}
        </Button>
      ),
    },
  ];

  return (
    <>
      <Seo title={t('admin.inventory.title')} index={false} />
      <PageHeader title={t('admin.inventory.title')} description={t('admin.inventory.subtitle')} />
      <FilterBar>
        <FormControlLabel
          control={
            <Switch
              checked={filters.lowStock === 'true'}
              onChange={(event) => {
                update({
                  lowStock: event.target.checked ? 'true' : undefined,
                  threshold: event.target.checked ? filters.threshold : undefined,
                });
              }}
            />
          }
          label={t('admin.inventory.lowStockOnly')}
        />
        {filters.lowStock === 'true' && (
          <TextField
            size="small"
            type="number"
            label={t('admin.inventory.threshold')}
            value={threshold}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isInteger(value) && value >= 0)
                update({ threshold: value }, { replace: true });
            }}
            sx={{ width: 140, '& .MuiFormControl-root': { minWidth: 0 } }}
            slotProps={{ htmlInput: { min: 0, max: 100000 } }}
          />
        )}
      </FilterBar>
      <DataTable
        caption={t('admin.inventory.caption')}
        columns={columns}
        rows={levels.data?.data}
        getRowId={(level) => level.variantId}
        isPending={levels.isPending}
        isFetching={levels.isPlaceholderData}
        error={levels.error}
        onRetry={() => void levels.refetch()}
        empty={
          <Typography color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
            {filters.lowStock ? t('admin.inventory.lowStockEmpty') : t('admin.inventory.empty')}
          </Typography>
        }
      />
      <ListFooter meta={levels.data?.meta} />
      {filters.variant && (
        <StockDrawer
          key={filters.variant}
          variantId={filters.variant}
          onClose={() => {
            openVariant(undefined);
          }}
        />
      )}
    </>
  );
}
