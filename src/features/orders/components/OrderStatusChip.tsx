import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import type { OrderStatus } from '@/api/schema';

/** Palette key per status; used for the dot only, so the label keeps full text contrast. */
export const STATUS_TONE = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'text.disabled',
} as const satisfies Record<OrderStatus, string>;

const dotColor = (tone: (typeof STATUS_TONE)[OrderStatus]) =>
  tone === 'text.disabled' ? tone : `${tone}.main`;

/**
 * Status badge: the text carries the meaning (never color alone); the colored dot is decorative.
 */
export function OrderStatusChip({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1,
        py: 0.25,
        border: 1,
        borderColor: 'divider',
        borderRadius: 999,
        typography: 'body2',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        component="span"
        aria-hidden
        sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dotColor(STATUS_TONE[status]) }}
      />
      {t(`orders.status.${status}`)}
    </Box>
  );
}
