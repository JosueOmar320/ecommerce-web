import FilterList from '@mui/icons-material/FilterListOutlined';
import SearchOff from '@mui/icons-material/SearchOffOutlined';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { getErrorMessage } from '@/lib/errorMessage';
import { currencySymbol, decimalToCents, formatMoney } from '@/lib/format';
import { productListQuery } from '../api';
import { countActiveFilters, SORTS, type ProductFilters, type Sort } from '../filters';
import { useProductFilters } from '../hooks/useProductFilters';
import { WishlistButton } from '@/features/wishlist/components/WishlistButton';
import { ActiveFilters } from './ActiveFilters';
import { LinkPagination } from '@/components/LinkPagination';
import { CatalogSearchField } from './CatalogSearchField';
import { FilterPanel } from './FilterPanel';
import { ProductCard } from './ProductCard';
import { ProductGrid, ProductGridItem, ProductGridSkeleton } from './ProductGrid';

interface ProductListingProps {
  /** Filters fixed by the page (e.g. the category of /categories/:slug). */
  fixed?: Partial<ProductFilters>;
  categoryNames?: Map<string, string>;
}

const SIDEBAR_WIDTH = 260;

export function ProductListing({ fixed, categoryNames }: ProductListingProps) {
  const { t, i18n } = useTranslation();
  const { filters, update, clear } = useProductFilters(fixed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sortId = useId();
  const query = useQuery(productListQuery(filters));

  const currency = query.data?.data[0]?.currency ?? 'USD';
  const symbol = currencySymbol(currency, i18n.language);
  const formatPrice = (major: string) =>
    formatMoney(decimalToCents(major), currency, i18n.language);
  const sortOptions = SORTS.filter((sort) => sort !== 'relevance' || filters.search);
  const sort: Sort = filters.sort ?? (filters.search ? 'relevance' : 'newest');
  const activeCount = countActiveFilters({
    ...filters,
    category: fixed?.category ? undefined : filters.category,
  });
  const total = query.data?.meta.total ?? 0;

  const panel = (
    <FilterPanel
      filters={filters}
      onChange={update}
      showCategories={!fixed?.category}
      currencySymbol={symbol}
    />
  );

  return (
    <Box sx={{ display: 'flex', gap: { md: 5 }, alignItems: 'flex-start' }}>
      <Box
        component="aside"
        aria-label={t('catalog.filters')}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          position: 'sticky',
          top: 88,
        }}
      >
        {panel}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 2.5 }}
        >
          <CatalogSearchField
            value={filters.search}
            onSearch={(search) => {
              update(
                {
                  search,
                  sort: search
                    ? filters.sort
                    : filters.sort === 'relevance'
                      ? undefined
                      : filters.sort,
                },
                { replace: true },
              );
            }}
          />
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Badge badgeContent={activeCount} color="primary" sx={{ display: { md: 'none' } }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setDrawerOpen(true);
                }}
              >
                {t('catalog.filters')}
              </Button>
            </Badge>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id={sortId}>{t('catalog.sortBy')}</InputLabel>
              <Select
                labelId={sortId}
                label={t('catalog.sortBy')}
                value={sort}
                onChange={(event) => {
                  update({ sort: event.target.value });
                }}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {t(`catalog.sort.${option}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {/* Announced politely whenever the results change (WCAG 4.1.3 status messages). */}
        <Typography role="status" color="textSecondary" sx={{ mb: 2 }}>
          {query.isPending
            ? ' '
            : query.isFetching
              ? t('catalog.updating')
              : t('catalog.resultCount', { count: total })}
        </Typography>

        <ActiveFilters
          filters={{ ...filters, category: fixed?.category ? undefined : filters.category }}
          categoryName={filters.category ? categoryNames?.get(filters.category) : undefined}
          formatPrice={formatPrice}
          onRemove={update}
          onClear={clear}
        />

        {query.isPending ? (
          <ProductGridSkeleton count={8} />
        ) : query.isError ? (
          <ErrorState
            title={t('catalog.loadErrorTitle')}
            description={getErrorMessage(query.error, t)}
            onRetry={() => void query.refetch()}
          />
        ) : query.data.data.length === 0 ? (
          <EmptyState
            icon={<SearchOff />}
            title={t('catalog.noResultsTitle')}
            description={t('catalog.noResultsBody')}
            action={
              activeCount > 0 || filters.search ? (
                <Button
                  variant="outlined"
                  onClick={() => {
                    update({
                      search: undefined,
                      category: undefined,
                      brand: undefined,
                      minPrice: undefined,
                      maxPrice: undefined,
                      availability: undefined,
                      sort: undefined,
                    });
                  }}
                >
                  {t('catalog.clearFilters')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Box
            aria-busy={query.isPlaceholderData}
            sx={{ opacity: query.isPlaceholderData ? 0.55 : 1, transition: 'opacity 120ms' }}
          >
            <ProductGrid>
              {query.data.data.map((product) => (
                <ProductGridItem key={product.id}>
                  <ProductCard
                    product={product}
                    headingLevel="h2"
                    action={<WishlistButton product={product} overlay size="small" />}
                  />
                </ProductGridItem>
              ))}
            </ProductGrid>
            <LinkPagination page={query.data.meta.page} totalPages={query.data.meta.totalPages} />
          </Box>
        )}
      </Box>

      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
        }}
        slotProps={{
          paper: { sx: { maxHeight: '85vh', borderTopLeftRadius: 8, borderTopRightRadius: 8 } },
        }}
      >
        <Box sx={{ px: 2.5, pt: 2.5 }}>
          <Typography variant="h4" component="h2">
            {activeCount > 0
              ? t('catalog.filtersWithCount', { count: activeCount })
              : t('catalog.filters')}
          </Typography>
        </Box>
        <Box sx={{ px: 2.5, overflowY: 'auto' }}>{panel}</Box>
        <Stack direction="row" spacing={1.5} sx={{ p: 2.5, borderTop: 1, borderColor: 'divider' }}>
          {activeCount > 0 && (
            <Button variant="outlined" onClick={clear}>
              {t('catalog.clearFilters')}
            </Button>
          )}
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              setDrawerOpen(false);
            }}
          >
            {t('catalog.showResults', { count: total })}
          </Button>
        </Stack>
      </Drawer>
    </Box>
  );
}
