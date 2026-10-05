import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '@/lib/format';

interface OrderTotalsProps {
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
}

/** Totals exactly as computed by the API: the browser never recalculates money. */
export function OrderTotals({
  currency,
  subtotalCents,
  shippingCents,
  taxCents,
  totalCents,
}: OrderTotalsProps) {
  const { t, i18n } = useTranslation();
  const money = (cents: number) => formatMoney(cents, currency, i18n.language);
  const row = (label: string, value: string, strong = false) => (
    // Each dt/dd pair sits in a div, the only grouping element a <dl> may contain.
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        py: 0.75,
        ...(strong && { mt: 1, pt: 1.75, borderTop: 1, borderColor: 'divider' }),
      }}
    >
      <Typography
        component="dt"
        sx={{ fontWeight: strong ? 650 : 400 }}
        color={strong ? 'textPrimary' : 'textSecondary'}
      >
        {label}
      </Typography>
      <Typography
        component="dd"
        sx={{ m: 0, fontWeight: strong ? 650 : 500, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Typography>
    </Box>
  );
  return (
    <Box component="dl" sx={{ m: 0 }}>
      {row(t('cart.subtotal'), money(subtotalCents))}
      {row(t('cart.shipping'), shippingCents === 0 ? t('cart.free') : money(shippingCents))}
      {row(t('cart.tax'), money(taxCents))}
      {row(t('cart.total'), money(totalCents), true)}
    </Box>
  );
}
