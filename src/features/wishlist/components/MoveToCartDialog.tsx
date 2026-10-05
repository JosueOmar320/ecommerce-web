import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProductSummary } from '@/api/schema';
import { productQuery } from '@/features/catalog/api';
import { VariantPicker } from '@/features/catalog/components/VariantPicker';
import {
  defaultVariant,
  findVariant,
  selectOption,
  type Selection,
} from '@/features/catalog/variants';
import { useAddToCart } from '@/features/cart/api';
import { getErrorMessage } from '@/lib/errorMessage';
import { formatMoney } from '@/lib/format';

interface MoveToCartDialogProps {
  product: ProductSummary;
  onClose: () => void;
  onMoved: () => void;
}

/**
 * The wishlist stores products, not variants, so moving one to the cart needs a variant choice.
 * MUI Dialog provides the focus trap, Esc to close and focus return to the trigger.
 */
export function MoveToCartDialog({ product, onClose, onMoved }: MoveToCartDialogProps) {
  const { t, i18n } = useTranslation();
  const detail = useQuery(productQuery(product.slug));
  const addToCart = useAddToCart();
  const [selection, setSelection] = useState<Selection | null>(null);

  const variants = detail.data?.variants ?? [];
  const axes = Object.keys(detail.data?.options ?? {});
  const current =
    selection ?? (detail.data ? { ...(defaultVariant(variants)?.attributes ?? {}) } : {});
  const variant =
    findVariant(variants, current, axes) ??
    (axes.length === 0 ? defaultVariant(variants) : undefined);

  return (
    <Dialog
      open
      // Stay open while adding: closing would skip removing the item from the wishlist.
      onClose={addToCart.isPending ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="move-to-cart-title"
    >
      <DialogTitle id="move-to-cart-title">
        {t('wishlist.chooseOptionsFor', { name: product.name })}
      </DialogTitle>
      <DialogContent>
        {detail.isPending ? (
          <Skeleton variant="rectangular" height={120} />
        ) : detail.isError ? (
          <Alert severity="error">{getErrorMessage(detail.error, t)}</Alert>
        ) : (
          <>
            {axes.length > 0 && (
              <VariantPicker
                options={detail.data.options}
                variants={variants}
                selection={current}
                onSelect={(axis, value) => {
                  setSelection(selectOption(variants, current, axis, value));
                }}
              />
            )}
            <Typography sx={{ mt: 3, fontWeight: 600 }}>
              {variant
                ? formatMoney(variant.priceCents, detail.data.currency, i18n.language)
                : t('product.unavailableCombination')}
              {variant && !variant.inStock && ` · ${t('product.outOfStock')}`}
            </Typography>
            {addToCart.isError && (
              <Alert severity="error" variant="outlined" sx={{ mt: 2 }}>
                {getErrorMessage(addToCart.error, t)}
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={addToCart.isPending}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={!variant?.inStock || addToCart.isPending}
          onClick={() => {
            if (!variant) return;
            addToCart.mutate({ variantId: variant.id, quantity: 1 }, { onSuccess: onMoved });
          }}
        >
          {addToCart.isPending ? t('product.adding') : t('wishlist.moveToCart')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
