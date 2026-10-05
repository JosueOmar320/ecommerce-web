import ArrowForward from '@mui/icons-material/ArrowForwardOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';
import { Seo } from '@/components/Seo';
import { categoriesQuery, productListQuery } from '@/features/catalog/api';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import {
  ProductGrid,
  ProductGridItem,
  ProductGridSkeleton,
} from '@/features/catalog/components/ProductGrid';
import { getErrorMessage } from '@/lib/errorMessage';

const NEW_ARRIVALS = { sort: 'newest' } as const;

function SectionHeader({
  title,
  description,
  to,
}: {
  title: string;
  description?: string;
  to?: string;
}) {
  const { t } = useTranslation();
  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'flex-end', justifyContent: 'space-between', mb: 3, gap: 2 }}
    >
      <div>
        <Typography variant="h3" component="h2">
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </div>
      {to && (
        <Button component={RouterLink} to={to} endIcon={<ArrowForward />} sx={{ flexShrink: 0 }}>
          {t('common.viewAll')}
        </Button>
      )}
    </Stack>
  );
}

/**
 * Only sections the API can back with real data: the category tree and the newest products.
 * (No "featured", "popular" or "promotions": the API has no such signals yet.)
 */
export function HomePage() {
  const { t } = useTranslation();
  const categories = useQuery(categoriesQuery);
  const arrivals = useQuery(productListQuery(NEW_ARRIVALS, 8));

  return (
    <>
      <Seo description={t('brand.tagline')} />
      <PageContainer>
        <Box
          component="section"
          aria-labelledby="hero-title"
          sx={{ py: { xs: 4, md: 10 }, maxWidth: 820 }}
        >
          <Typography variant="overline" component="p" color="primary">
            {t('home.heroEyebrow')}
          </Typography>
          <Typography id="hero-title" variant="h1" sx={{ mt: 1 }}>
            {t('home.heroTitle')}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 2.5, maxWidth: 600 }}>
            {t('home.heroBody')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
            <Button component={RouterLink} to="/products" variant="contained" size="large">
              {t('home.heroCta')}
            </Button>
            <Button
              component={RouterLink}
              to="/products?sort=newest"
              variant="outlined"
              size="large"
            >
              {t('home.heroSecondary')}
            </Button>
          </Stack>
        </Box>

        <Box component="section" sx={{ mt: { xs: 4, md: 6 } }}>
          <SectionHeader title={t('home.categoriesTitle')} />
          <Grid container spacing={2}>
            {categories.isPending
              ? Array.from({ length: 3 }, (_, i) => (
                  <Grid key={i} size={{ xs: 12, sm: 4 }}>
                    <Skeleton variant="rectangular" height={160} />
                  </Grid>
                ))
              : (categories.data ?? []).map((category) => (
                  <Grid key={category.id} size={{ xs: 12, sm: 4 }}>
                    <Box
                      component={RouterLink}
                      to={`/categories/${category.slug}`}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                        minHeight: 160,
                        p: 3,
                        border: 1,
                        borderColor: 'divider',
                        color: 'text.primary',
                        textDecoration: 'none',
                        transition: 'border-color 120ms, background-color 120ms',
                        '&:hover': { borderColor: 'text.primary', bgcolor: 'action.hover' },
                      }}
                    >
                      <Typography variant="h4" component="h3">
                        {category.name}
                      </Typography>
                      <div>
                        {category.description && (
                          <Typography variant="body2" color="text.secondary">
                            {category.description}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 600 }}>
                          {category.children.map((child) => child.name).join(' · ')}
                        </Typography>
                      </div>
                    </Box>
                  </Grid>
                ))}
          </Grid>
          {categories.isError && (
            <ErrorState
              headingLevel="h3"
              description={getErrorMessage(categories.error, t)}
              onRetry={() => void categories.refetch()}
            />
          )}
        </Box>

        <Box component="section" sx={{ mt: { xs: 8, md: 12 } }}>
          <SectionHeader
            title={t('home.newArrivalsTitle')}
            description={t('home.newArrivalsBody')}
            to="/products?sort=newest"
          />
          {arrivals.isPending ? (
            <ProductGridSkeleton count={8} />
          ) : arrivals.isError ? (
            <ErrorState
              headingLevel="h3"
              description={getErrorMessage(arrivals.error, t)}
              onRetry={() => void arrivals.refetch()}
            />
          ) : (
            <ProductGrid>
              {arrivals.data.data.map((product) => (
                <ProductGridItem key={product.id}>
                  <ProductCard product={product} />
                </ProductGridItem>
              ))}
            </ProductGrid>
          )}
        </Box>
      </PageContainer>
    </>
  );
}
