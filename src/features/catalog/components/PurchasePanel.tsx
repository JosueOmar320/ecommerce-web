import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@/lib/a11y';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation } from 'react-router';
import type { ProductDetail, ProductVariant } from '@/api/schema';
import { useNotify } from '@/components/Notifications';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useSession } from '@/features/auth/session';
import { useAddToCart } from '@/features/cart/api';
import { getErrorMessage } from '@/lib/errorMessage';
import { formatMoney } from '@/lib/format';
import { loginPath } from '@/lib/safeRedirect';

/** Same per-line limit the API enforces (MAX_QUANTITY_PER_LINE). */
export const MAX_PER_LINE = 20;
const LOW_STOCK = 5;

interface PurchasePanelProps {
  product: ProductDetail;
  variant: ProductVariant | undefined;
}

export function PurchasePanel({ product, variant }: PurchasePanelProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const notify = useNotify();
  const { status } = useSession();
  const addToCart = useAddToCart();
  const [quantity, setQuantity] = useState(1);

  const max = variant ? Math.min(variant.availableQuantity, MAX_PER_LINE) : 1;
  const qty = Math.min(quantity, Math.max(max, 1));
  const canBuy = Boolean(variant?.inStock);
  const money = (cents: number) => formatMoney(cents, product.currency, i18n.language);
  const discount =
    variant?.compareAtPriceCents && variant.compareAtPriceCents > variant.priceCents
      ? Math.round((1 - variant.priceCents / variant.compareAtPriceCents) * 100)
      : null;

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
        <Typography variant="h3" component="p" sx={{ fontWeight: 650 }}>
          {variant ? money(variant.priceCents) : '—'}
        </Typography>
        {variant?.compareAtPriceCents && discount !== null && (
          <>
            <Typography color="textSecondary" sx={{ textDecoration: 'line-through' }}>
              <Box component="span" sx={visuallyHidden}>
                {t('product.compareAt', { price: '' })}
              </Box>
              {money(variant.compareAtPriceCents)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 650 }}>
              {t('product.save', { percent: discount })}
            </Typography>
          </>
        )}
      </Stack>

      <Typography
        variant="body2"
        sx={{
          mt: 1,
          fontWeight: 600,
          color: canBuy
            ? variant && variant.availableQuantity <= LOW_STOCK
              ? 'warning.main'
              : 'success.main'
            : 'text.secondary',
        }}
      >
        {!variant
          ? t('product.unavailableCombination')
          : !canBuy
            ? t('product.outOfStock')
            : variant.availableQuantity <= LOW_STOCK
              ? t('product.lowStock', { count: variant.availableQuantity })
              : t('product.inStock')}
      </Typography>

      {addToCart.isError && (
        <Alert severity="error" variant="outlined" sx={{ mt: 2 }} role="alert">
          {getErrorMessage(addToCart.error, t)}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
        <QuantityStepper
          label={t('product.quantity')}
          value={qty}
          max={max}
          disabled={!canBuy}
          onChange={setQuantity}
        />
        {status === 'authenticated' ? (
          <Button
            variant="contained"
            size="large"
            sx={{ flex: 1 }}
            disabled={!canBuy || addToCart.isPending}
            onClick={() => {
              if (!variant) return;
              addToCart.mutate(
                { variantId: variant.id, quantity: qty },
                {
                  onSuccess: () => {
                    notify({
                      message: t('product.addedToCart'),
                      action: { label: t('product.viewCart'), to: '/cart' },
                    });
                  },
                },
              );
            }}
          >
            {!canBuy
              ? t('product.soldOut')
              : addToCart.isPending
                ? t('product.adding')
                : t('product.addToCart')}
          </Button>
        ) : (
          <Button
            component={RouterLink}
            to={loginPath(location.pathname + location.search)}
            variant="contained"
            size="large"
            sx={{ flex: 1 }}
            disabled={!canBuy}
          >
            {canBuy ? t('product.signInToBuy') : t('product.soldOut')}
          </Button>
        )}
      </Stack>
      {canBuy && max === MAX_PER_LINE && qty === max && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          {t('product.maxPerOrder', { count: MAX_PER_LINE })}
        </Typography>
      )}
    </Box>
  );
}
