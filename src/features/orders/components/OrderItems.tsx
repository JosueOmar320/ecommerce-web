import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import type { OrderItem } from '@/api/schema';
import { ProductMedia } from '@/features/catalog/components/ProductMedia';
import { formatMoney } from '@/lib/format';

/**
 * Lines as they were sold: names and prices are the order's own snapshot, so they never change
 * when the catalog does (and are not linked, since the product may no longer be published).
 */
export function OrderItems({ items, currency }: { items: OrderItem[]; currency: string }) {
  const { t, i18n } = useTranslation();
  const money = (cents: number) => formatMoney(cents, currency, i18n.language);
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {items.map((item) => (
        <Box
          component="li"
          key={item.id}
          sx={{
            display: 'grid',
            gridTemplateColumns: '56px 1fr auto',
            gap: 2,
            alignItems: 'center',
            py: 2,
            '& + &': { borderTop: 1, borderColor: 'divider' },
          }}
        >
          <ProductMedia seed={item.productId} brand={null} name={item.productName} size="thumb" />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600 }}>{item.productName}</Typography>
            <Typography variant="body2" color="textSecondary">
              {item.variantName} · {t('orders.sku', { sku: item.sku })}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {t('orders.quantityTimesPrice', {
                quantity: item.quantity,
                price: money(item.unitPriceCents),
              })}
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {money(item.lineTotalCents)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
