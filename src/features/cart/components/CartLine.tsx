import Delete from '@mui/icons-material/DeleteOutlineOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CartItem } from '@/api/schema';
import { AppLink } from '@/components/AppLink';
import { QuantityStepper } from '@/components/QuantityStepper';
import { ProductMedia } from '@/features/catalog/components/ProductMedia';
import { MAX_PER_LINE } from '@/features/catalog/components/PurchasePanel';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatMoney } from '@/lib/format';
import { rememberedPrice } from '../priceMemory';

interface CartLineProps {
  item: CartItem;
  currency: string;
  busy: boolean;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartLine({ item, currency, busy, onQuantity, onRemove }: CartLineProps) {
  const { t, i18n } = useTranslation();
  const money = (cents: number) => formatMoney(cents, currency, i18n.language);

  // Local draft so rapid +/− clicks become one request after a short pause.
  const [draft, setDraft] = useState(item.quantity);
  const [synced, setSynced] = useState(item.quantity);
  if (synced !== item.quantity) {
    setSynced(item.quantity);
    setDraft(item.quantity);
  }
  const debounced = useDebouncedValue(draft, 400);
  useEffect(() => {
    if (debounced !== item.quantity) onQuantity(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to the user's input only
  }, [debounced]);

  const previous = rememberedPrice(item.variantId);
  const priceChanged = previous !== undefined && previous !== item.unitPriceCents;
  const maxQuantity = Math.max(
    1,
    Math.min(MAX_PER_LINE, Math.max(item.availableQuantity, item.quantity)),
  );

  return (
    <Box
      component="li"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '88px 1fr', sm: '112px 1fr auto' },
        gap: { xs: 2, sm: 3 },
        py: 3,
        borderBottom: 1,
        borderColor: 'divider',
        opacity: item.issue === 'PRODUCT_UNAVAILABLE' ? 0.7 : 1,
      }}
    >
      <ProductMedia seed={item.productId} brand={null} name={item.productName} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          <AppLink
            to={`/products/${item.productSlug}?variant=${encodeURIComponent(item.sku)}`}
            color="inherit"
          >
            {item.productName}
          </AppLink>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {item.variantName} · {item.sku}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {t('cart.unitPrice', { price: money(item.unitPriceCents) })}
        </Typography>

        {priceChanged && (
          <Alert severity="info" variant="outlined" sx={{ mt: 1.5, py: 0 }}>
            {t('cart.priceChanged', { from: money(previous), to: money(item.unitPriceCents) })}
          </Alert>
        )}
        {item.issue && (
          <Alert severity="warning" variant="outlined" sx={{ mt: 1.5, py: 0 }}>
            {item.issue === 'PRODUCT_UNAVAILABLE'
              ? t('cart.issueUnavailable')
              : t('cart.issueStock', { count: item.availableQuantity })}
          </Alert>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <QuantityStepper
            size="small"
            label={t('cart.quantityFor', { name: item.productName })}
            value={draft}
            max={maxQuantity}
            disabled={item.issue === 'PRODUCT_UNAVAILABLE'}
            onChange={setDraft}
          />
          <IconButton
            aria-label={t('cart.remove', { name: item.productName })}
            onClick={onRemove}
            disabled={busy}
          >
            <Delete />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ gridColumn: { xs: '2', sm: 'auto' }, textAlign: { sm: 'right' } }}>
        <Typography sx={{ fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>
          <Box component="span" sx={{ display: { sm: 'none' } }}>
            {t('cart.lineTotal')}:{' '}
          </Box>
          {money(item.lineTotalCents)}
        </Typography>
      </Box>
    </Box>
  );
}
