import Add from '@mui/icons-material/AddOutlined';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import type { ProductSummary } from '@/api/schema';
import { AppLink } from '@/components/AppLink';
import { PageHeader } from '@/components/PageHeader';
import { SearchField } from '@/components/SearchField';
import { Seo } from '@/components/Seo';
import { useSession } from '@/features/auth/session';
import { categoriesQuery } from '@/features/catalog/api';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { formatDate, formatPriceRange } from '@/lib/format';
import { flattenCategories } from '../api/categories';
import { adminProductsQuery, PRODUCT_STATUSES, productFiltersSchema } from '../api/products';
import { DataTable, type Column } from '../components/DataTable';
import { FilterBar, FilterSelect } from '../components/FilterBar';
import { ListFooter } from '../components/ListFooter';
import { ProductStatusPill } from '../components/ProductStatusPill';

export function AdminProductsPage() {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useSession();
  const { filters, update } = useUrlFilters(productFiltersSchema);
  const products = useQuery(adminProductsQuery(filters));
  // Public tree: products can only be filtered by categories shoppers can see.
  const categories = useQuery(categoriesQuery);

  const columns: Column<ProductSummary>[] = [
    {
      id: 'name',
      header: t('admin.products.name'),
      cell: (product) => (
        <>
          <AppLink to={`/admin/products/${product.id}`} sx={{ fontWeight: 650 }}>
            {product.name}
          </AppLink>
          <Typography variant="body2" color="textSecondary">
            {product.brand ?? '—'}
          </Typography>
        </>
      ),
    },
    {
      id: 'status',
      header: t('admin.products.status'),
      cell: (product) => <ProductStatusPill status={product.status} />,
    },
    {
      id: 'price',
      header: t('admin.products.price'),
      align: 'right',
      cell: (product) =>
        formatPriceRange(
          product.minPriceCents,
          product.maxPriceCents,
          product.currency,
          i18n.language,
        ),
    },
    {
      id: 'stock',
      header: t('admin.products.stock'),
      hideBelow: 'sm',
      cell: (product) => (
        <Typography variant="body2" color={product.inStock ? 'textPrimary' : 'error'}>
          {product.inStock ? t('admin.products.inStock') : t('admin.products.outOfStock')}
        </Typography>
      ),
    },
    {
      id: 'categories',
      header: t('admin.products.categories'),
      hideBelow: 'md',
      cell: (product) =>
        product.categories.map((category) => category.name).join(', ') ||
        t('admin.products.noCategories'),
    },
    {
      id: 'created',
      header: t('admin.products.created'),
      hideBelow: 'lg',
      cell: (product) => formatDate(product.createdAt, i18n.language),
    },
  ];

  return (
    <>
      <Seo title={t('admin.products.title')} index={false} />
      <PageHeader
        title={t('admin.products.title')}
        description={t('admin.products.subtitle')}
        actions={
          hasPermission('products:create') && (
            <Button
              component={RouterLink}
              to="/admin/products/new"
              variant="contained"
              startIcon={<Add />}
            >
              {t('admin.products.new')}
            </Button>
          )
        }
      />
      <FilterBar>
        <SearchField
          label={t('admin.products.search')}
          value={filters.search}
          onSearch={(search) => {
            update({ search }, { replace: true });
          }}
        />
        <FilterSelect
          label={t('admin.products.status')}
          value={filters.status}
          onChange={(event) => {
            const status = PRODUCT_STATUSES.find((value) => value === event.target.value);
            update({ status: status === 'ACTIVE' ? undefined : status });
          }}
        >
          {PRODUCT_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {t(`admin.products.statuses.${status}`)}
            </MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect
          label={t('admin.products.category')}
          value={filters.category ?? ''}
          onChange={(event) => {
            update({ category: event.target.value || undefined });
          }}
        >
          <MenuItem value="">{t('admin.products.allCategories')}</MenuItem>
          {flattenCategories(categories.data ?? []).map(({ node, depth }) => (
            <MenuItem key={node.id} value={node.slug} sx={{ pl: 2 + depth * 2 }}>
              {node.name}
            </MenuItem>
          ))}
        </FilterSelect>
      </FilterBar>
      <DataTable
        caption={t('admin.products.caption')}
        columns={columns}
        rows={products.data?.data}
        getRowId={(product) => product.id}
        isPending={products.isPending}
        isFetching={products.isPlaceholderData}
        error={products.error}
        onRetry={() => void products.refetch()}
        empty={
          <Typography color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
            {t('admin.products.empty')}
          </Typography>
        }
      />
      <ListFooter meta={products.data?.meta} />
    </>
  );
}
