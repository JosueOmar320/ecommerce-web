import ShoppingBag from '@mui/icons-material/ShoppingBagOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useNotify } from '@/components/Notifications';
import { OrderTotals } from '@/components/OrderTotals';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { PageLoader } from '@/components/PageLoader';
import { Seo } from '@/components/Seo';
import { useSession } from '@/features/auth/session';
import { getErrorMessage } from '@/lib/errorMessage';
import { loginPath } from '@/lib/safeRedirect';
import { cartQuery, useClearCart, useRemoveCartItem, useUpdateCartItem } from '../api';
import { CartLine } from '../components/CartLine';

export function CartPage() {
  const { t } = useTranslation();
  const notify = useNotify();
  const { status } = useSession();
  const cart = useQuery({ ...cartQuery, enabled: status === 'authenticated' });
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const clear = useClearCart();
  const [confirmClear, setConfirmClear] = useState(false);
  const mutationError = update.error ?? remove.error ?? clear.error;

  const header = (description?: string) => (
    <>
      <Seo title={t('cart.title')} index={false} />
      <PageHeader title={t('cart.title')} description={description} />
    </>
  );

  if (status === 'loading') return <PageLoader />;
  if (status === 'anonymous') {
    return (
      <PageContainer>
        {header()}
        <EmptyState
          icon={<ShoppingBag />}
          title={t('cart.signInTitle')}
          description={t('cart.signInBody')}
          action={
            <Button component={RouterLink} to={loginPath('/cart')} variant="contained">
              {t('nav.signIn')}
            </Button>
          }
        />
      </PageContainer>
    );
  }
  if (cart.isPending) {
    return (
      <PageContainer>
        {header()}
        <Skeleton variant="rectangular" height={160} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={160} />
      </PageContainer>
    );
  }
  if (cart.isError) {
    return (
      <PageContainer>
        {header()}
        <ErrorState
          description={getErrorMessage(cart.error, t)}
          onRetry={() => void cart.refetch()}
        />
      </PageContainer>
    );
  }

  const data = cart.data;
  if (data.items.length === 0) {
    return (
      <PageContainer>
        {header()}
        <EmptyState
          icon={<ShoppingBag />}
          title={t('cart.emptyTitle')}
          description={t('cart.emptyBody')}
          action={
            <Button component={RouterLink} to="/products" variant="contained">
              {t('cart.continueShopping')}
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {header(t('cart.itemCount', { count: data.itemCount }))}
      <Grid container spacing={{ xs: 4, md: 8 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          {mutationError && (
            <Alert severity="error" variant="outlined" sx={{ mb: 2 }} role="alert">
              {getErrorMessage(mutationError, t)}
            </Alert>
          )}
          <Box
            component="ul"
            aria-label={t('cart.items')}
            sx={{ listStyle: 'none', p: 0, m: 0, borderTop: 1, borderColor: 'divider' }}
          >
            {data.items.map((item) => (
              <CartLine
                key={item.id}
                item={item}
                currency={data.currency}
                busy={remove.isPending}
                onQuantity={(quantity, revert) => {
                  update.mutate({ itemId: item.id, quantity }, { onError: revert });
                }}
                onRemove={() => {
                  remove.mutate(item.id, {
                    onSuccess: () => {
                      notify({ message: t('cart.removed'), severity: 'info' });
                    },
                  });
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button component={RouterLink} to="/products">
              {t('cart.continueShopping')}
            </Button>
            <Button
              color="error"
              onClick={() => {
                setConfirmClear(true);
              }}
            >
              {t('cart.emptyCart')}
            </Button>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            component="section"
            aria-labelledby="cart-summary"
            sx={{
              position: { md: 'sticky' },
              top: { md: 96 },
              p: 3,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Typography id="cart-summary" variant="h5" component="h2" sx={{ mb: 2 }}>
              {t('cart.summary')}
            </Typography>
            <OrderTotals {...data} />
            {!data.isCheckoutReady && (
              <Alert severity="warning" variant="outlined" sx={{ mt: 2 }}>
                {t('cart.notReady')}
              </Alert>
            )}
            <Button
              component={RouterLink}
              to="/checkout"
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 3 }}
              disabled={!data.isCheckoutReady}
            >
              {t('cart.checkout')}
            </Button>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1.5 }}>
              {t('cart.pricesNote')}
            </Typography>
          </Box>
        </Grid>
      </Grid>
      <ConfirmDialog
        open={confirmClear}
        title={t('cart.emptyConfirmTitle')}
        description={t('cart.emptyConfirmBody')}
        confirmLabel={t('cart.emptyCart')}
        destructive
        pending={clear.isPending}
        onClose={() => {
          setConfirmClear(false);
        }}
        onConfirm={() => {
          clear.mutate(undefined, {
            onSuccess: () => {
              setConfirmClear(false);
            },
          });
        }}
      />
    </PageContainer>
  );
}
