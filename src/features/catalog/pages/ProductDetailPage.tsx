import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router';
import { isApiError } from '@/api/errors';
import type { ProductDetail } from '@/api/schema';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { AppLink } from '@/components/AppLink';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';
import { Seo } from '@/components/Seo';
import { WishlistButton } from '@/features/wishlist/components/WishlistButton';
import { getErrorMessage } from '@/lib/errorMessage';
import { productQuery } from '../api';
import { ProductMedia } from '../components/ProductMedia';
import { PurchasePanel } from '../components/PurchasePanel';
import { VariantPicker } from '../components/VariantPicker';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { defaultVariant, findVariant, selectOption, type Selection } from '../variants';

/** schema.org Product data for search engines. `<` is escaped so content cannot close the tag. */
function ProductJsonLd({ product }: { product: ProductDetail }) {
  const json = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: product.currency,
      lowPrice: product.minPriceCents !== null ? product.minPriceCents / 100 : undefined,
      highPrice: product.maxPriceCents !== null ? product.maxPriceCents / 100 : undefined,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  }).replace(/</g, '\\u003c');
  return <script type="application/ld+json">{json}</script>;
}

function ProductSkeleton() {
  return (
    <PageContainer aria-hidden>
      <Grid container spacing={{ xs: 3, md: 8 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Skeleton variant="rectangular" sx={{ aspectRatio: '4 / 5', height: 'auto' }} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Skeleton width="30%" />
          <Skeleton variant="text" height={64} />
          <Skeleton width="40%" height={48} />
          <Skeleton variant="rectangular" height={120} sx={{ mt: 3 }} />
        </Grid>
      </Grid>
    </PageContainer>
  );
}

export function ProductDetailPage() {
  const { t } = useTranslation();
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const query = useQuery(productQuery(slug));
  const { record } = useRecentlyViewed();

  useEffect(() => {
    if (query.data) record(query.data.slug);
  }, [query.data, record]);

  const product = query.data;
  const axes = useMemo(() => Object.keys(product?.options ?? {}), [product]);
  const fromUrl = product?.variants.find((v) => v.isActive && v.sku === params.get('variant'));
  const selected = fromUrl ?? (product ? defaultVariant(product.variants) : undefined);
  const selection: Selection = selected ? { ...selected.attributes } : {};

  if (query.isPending) return <ProductSkeleton />;
  if (query.isError) {
    if (isApiError(query.error) && query.error.status === 404) return <NotFoundPage />;
    return (
      <PageContainer>
        <ErrorState
          description={getErrorMessage(query.error, t)}
          onRetry={() => void query.refetch()}
        />
      </PageContainer>
    );
  }
  if (!product) return null;

  const onSelect = (axis: string, value: string) => {
    const next = selectOption(product.variants, selection, axis, value);
    const variant = findVariant(product.variants, next, axes);
    const nextParams = new URLSearchParams(params);
    if (variant) nextParams.set('variant', variant.sku);
    setParams(nextParams, { replace: true, preventScrollReset: true });
  };
  const variant =
    findVariant(product.variants, selection, axes) ?? (axes.length === 0 ? selected : undefined);
  const category = product.categories.at(-1);

  return (
    <PageContainer>
      <Seo
        title={product.name}
        description={product.description.slice(0, 160)}
        canonicalPath={`/products/${product.slug}`}
      />
      <ProductJsonLd product={product} />

      <Breadcrumbs
        aria-label={t('product.breadcrumb')}
        sx={{ mb: 3, '& ol': { flexWrap: 'wrap' } }}
      >
        <AppLink to="/" color="text.secondary">
          {t('nav.home')}
        </AppLink>
        {category ? (
          <AppLink to={`/categories/${category.slug}`} color="text.secondary">
            {category.name}
          </AppLink>
        ) : (
          <AppLink to="/products" color="text.secondary">
            {t('nav.allProducts')}
          </AppLink>
        )}
        <Typography color="textPrimary" aria-current="page">
          {product.name}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={{ xs: 3, md: 8 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Box sx={{ position: { md: 'sticky' }, top: { md: 96 } }}>
            <ProductMedia seed={product.id} brand={product.brand} name={product.name} size="hero" />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack
            direction="row"
            sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}
          >
            <div>
              {product.brand && (
                <AppLink
                  to={`/products?brand=${encodeURIComponent(product.brand.toLowerCase())}`}
                  variant="overline"
                  color="text.secondary"
                  aria-label={t('product.moreFromBrand', { brand: product.brand })}
                >
                  {product.brand}
                </AppLink>
              )}
              <Typography variant="h2" component="h1">
                {product.name}
              </Typography>
            </div>
            <WishlistButton product={product} />
          </Stack>

          <Box sx={{ mt: 3 }}>
            <PurchasePanel key={variant?.id ?? 'none'} product={product} variant={variant} />
          </Box>

          {axes.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <VariantPicker
                options={product.options}
                variants={product.variants}
                selection={selection}
                onSelect={onSelect}
              />
            </Box>
          )}

          <Divider sx={{ my: 4 }} />
          <Typography variant="h5" component="h2" gutterBottom>
            {t('product.description')}
          </Typography>
          {/* Rendered as text: product content is never injected as HTML. */}
          <Typography color="textSecondary" sx={{ whiteSpace: 'pre-line' }}>
            {product.description}
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 1.5 }}>
            {t('product.details')}
          </Typography>
          <Box
            component="dl"
            sx={{
              display: 'grid',
              gridTemplateColumns: 'max-content 1fr',
              columnGap: 3,
              rowGap: 1,
              m: 0,
            }}
          >
            {variant && (
              <>
                <Typography component="dt" color="textSecondary">
                  {t('product.sku')}
                </Typography>
                <Typography
                  component="dd"
                  sx={{ m: 0, fontFamily: 'ui-monospace, monospace', fontSize: '0.875rem' }}
                >
                  {variant.sku}
                </Typography>
              </>
            )}
            {product.categories.length > 0 && (
              <>
                <Typography component="dt" color="textSecondary">
                  {t('product.categories')}
                </Typography>
                <Box component="dd" sx={{ m: 0 }}>
                  {product.categories.map((c, i) => (
                    <span key={c.id}>
                      {i > 0 && ', '}
                      <AppLink to={`/categories/${c.slug}`}>{c.name}</AppLink>
                    </span>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
