import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';
import type { Order } from '@/api/schema';
import { ErrorState } from '@/components/ErrorState';
import { useNotify } from '@/components/Notifications';
import { OrderTotals } from '@/components/OrderTotals';
import { addressesQuery } from '@/features/account/api';
import { cartKeys, cartQuery } from '@/features/cart/api';
import { forgetPrices } from '@/features/cart/priceMemory';
import { createOrder, orderKeys } from '@/features/orders/api';
import { getErrorMessage } from '@/lib/errorMessage';
import { formatMoney } from '@/lib/format';
import { clearIdempotencyKey, getIdempotencyKey } from '@/lib/idempotency';
import { formatAddress } from '@/features/account/formatAddress';
import { StepHeading } from './StepHeading';

const ORDER_KEY_SCOPE = 'checkout-order';

interface ReviewStepProps {
  addressId: string;
  onChangeAddress: () => void;
  onPlaced: (order: Order) => void;
}

export function ReviewStep({ addressId, onChangeAddress, onPlaced }: ReviewStepProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const cart = useQuery(cartQuery);
  const addresses = useQuery(addressesQuery);
  const place = useMutation({
    mutationFn: () => createOrder(addressId, getIdempotencyKey(ORDER_KEY_SCOPE)),
    onSuccess: (order) => {
      clearIdempotencyKey(ORDER_KEY_SCOPE);
      forgetPrices([]);
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      // Move on first: emptying the cached cart below must not trigger the "empty cart" guard.
      onPlaced(order);
      notify({ message: t('checkout.orderCreated', { number: order.orderNumber }) });
      // The API emptied the cart in the same transaction; reflect it without another request.
      queryClient.setQueryData(
        cartKeys.all,
        (old: typeof cart.data) =>
          old && { ...old, items: [], itemCount: 0, isCheckoutReady: false },
      );
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: () => {
      // Stock or price changed: show the fresh cart before the customer tries again.
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });

  if (cart.isPending || addresses.isPending) return <Skeleton variant="rectangular" height={280} />;
  if (cart.isError)
    return (
      <ErrorState
        headingLevel="h3"
        description={getErrorMessage(cart.error, t)}
        onRetry={() => void cart.refetch()}
      />
    );
  // Only redirect when nothing was attempted: after placing, the cart is empty by design.
  if (cart.data.items.length === 0 && place.isIdle) return <Navigate to="/cart" replace />;

  const address = addresses.data?.find((a) => a.id === addressId);
  const money = (cents: number) => formatMoney(cents, cart.data.currency, i18n.language);

  return (
    <div>
      <StepHeading>{t('checkout.reviewTitle')}</StepHeading>

      <Box
        component="section"
        aria-labelledby="ship-to"
        sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 3 }}
      >
        <div>
          <Typography id="ship-to" variant="overline" component="h3" color="textSecondary">
            {t('checkout.shipTo')}
          </Typography>
          {address ? (
            <>
              <Typography sx={{ fontWeight: 600 }}>{address.recipientName}</Typography>
              <Typography variant="body2" color="textSecondary">
                {formatAddress(address)}
              </Typography>
            </>
          ) : (
            <Typography color="error">{t('errors.api.VALIDATION_ERROR')}</Typography>
          )}
        </div>
        <Button onClick={onChangeAddress} sx={{ alignSelf: 'flex-start' }}>
          {t('checkout.change')}
        </Button>
      </Box>
      <Divider />

      <Box component="ul" sx={{ listStyle: 'none', p: 0, my: 2 }}>
        {cart.data.items.map((item) => (
          <Box
            component="li"
            key={item.id}
            sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1 }}
          >
            <div>
              <Typography sx={{ fontWeight: 600 }}>
                {item.productName} × {item.quantity}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {item.variantName}
              </Typography>
              {item.issue && (
                <Typography variant="body2" color="warning">
                  {item.issue === 'PRODUCT_UNAVAILABLE'
                    ? t('cart.issueUnavailable')
                    : t('cart.issueStock', { count: item.availableQuantity })}
                </Typography>
              )}
            </div>
            <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {money(item.lineTotalCents)}
            </Typography>
          </Box>
        ))}
      </Box>
      <Divider sx={{ mb: 2 }} />
      <OrderTotals {...cart.data} />

      {place.isError && (
        <Alert severity="error" variant="outlined" sx={{ mt: 3 }} role="alert">
          {getErrorMessage(place.error, t)}
        </Alert>
      )}
      <Button
        variant="contained"
        size="large"
        fullWidth
        sx={{ mt: 3 }}
        disabled={place.isPending || !cart.data.isCheckoutReady || !address}
        onClick={() => {
          place.mutate();
        }}
      >
        {place.isPending
          ? t('checkout.placing')
          : t('checkout.placeOrder', { total: money(cart.data.totalCents) })}
      </Button>
    </div>
  );
}
