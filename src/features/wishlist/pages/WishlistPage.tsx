import FavoriteBorder from '@mui/icons-material/FavoriteBorderOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import type { ProductSummary } from '@/api/schema';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useNotify } from '@/components/Notifications';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { PageLoader } from '@/components/PageLoader';
import { Seo } from '@/components/Seo';
import { useSession } from '@/features/auth/session';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import {
  ProductGrid,
  ProductGridItem,
  ProductGridSkeleton,
} from '@/features/catalog/components/ProductGrid';
import { getErrorMessage } from '@/lib/errorMessage';
import { loginPath } from '@/lib/safeRedirect';
import { useToggleWishlist, wishlistQuery } from '../api';
import { MoveToCartDialog } from '../components/MoveToCartDialog';
import { WishlistButton } from '../components/WishlistButton';

export function WishlistPage() {
  const { t } = useTranslation();
  const notify = useNotify();
  const { status } = useSession();
  const wishlist = useQuery({ ...wishlistQuery, enabled: status === 'authenticated' });
  const toggle = useToggleWishlist();
  const [moving, setMoving] = useState<ProductSummary | null>(null);

  const header = (
    <>
      <Seo title={t('wishlist.title')} index={false} />
      <PageHeader
        title={t('wishlist.title')}
        description={
          wishlist.data
            ? t('wishlist.count', { count: wishlist.data.length })
            : t('wishlist.description')
        }
      />
    </>
  );

  if (status === 'loading') return <PageLoader />;
  if (status === 'anonymous') {
    return (
      <PageContainer>
        {header}
        <EmptyState
          icon={<FavoriteBorder />}
          title={t('wishlist.signInTitle')}
          description={t('wishlist.signInBody')}
          action={
            <Button component={RouterLink} to={loginPath('/wishlist')} variant="contained">
              {t('nav.signIn')}
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {header}
      {wishlist.isPending ? (
        <ProductGridSkeleton count={4} />
      ) : wishlist.isError ? (
        <ErrorState
          description={getErrorMessage(wishlist.error, t)}
          onRetry={() => void wishlist.refetch()}
        />
      ) : wishlist.data.length === 0 ? (
        <EmptyState
          icon={<FavoriteBorder />}
          title={t('wishlist.emptyTitle')}
          description={t('wishlist.emptyBody')}
          action={
            <Button component={RouterLink} to="/products" variant="contained">
              {t('nav.allProducts')}
            </Button>
          }
        />
      ) : (
        <ProductGrid>
          {wishlist.data.map((item) => (
            <ProductGridItem key={item.productId}>
              {item.product ? (
                <Stack spacing={1.5}>
                  <ProductCard
                    product={item.product}
                    headingLevel="h2"
                    action={<WishlistButton product={item.product} overlay size="small" />}
                  />
                  <Button
                    variant="outlined"
                    disabled={!item.product.inStock}
                    onClick={() => {
                      setMoving(item.product);
                    }}
                  >
                    {item.product.inStock ? t('wishlist.moveToCart') : t('product.outOfStock')}
                  </Button>
                </Stack>
              ) : (
                // The product was unpublished or deleted: say so and let the user tidy up.
                <Box
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    p: 2,
                    aspectRatio: '4 / 5',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography color="textSecondary">{t('wishlist.unavailable')}</Typography>
                  <Button
                    onClick={() => {
                      toggle.mutate({ productId: item.productId, saved: true });
                    }}
                  >
                    {t('wishlist.remove')}
                  </Button>
                </Box>
              )}
            </ProductGridItem>
          ))}
        </ProductGrid>
      )}
      {moving && (
        <MoveToCartDialog
          product={moving}
          onClose={() => {
            setMoving(null);
          }}
          onMoved={() => {
            toggle.mutate({ productId: moving.id, saved: true });
            setMoving(null);
            notify({
              message: t('wishlist.movedToCart'),
              action: { label: t('product.viewCart'), to: '/cart' },
            });
          }}
        />
      )}
    </PageContainer>
  );
}
