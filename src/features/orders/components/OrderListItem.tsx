import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import type { OrderSummary } from '@/api/schema';
import { AppLink } from '@/components/AppLink';
import { formatDate, formatMoney } from '@/lib/format';
import { OrderStatusChip } from './OrderStatusChip';

/**
 * One order in a list. The order number is the single link, stretched over the row, so the whole
 * row is clickable without nesting interactive elements.
 */
export function OrderListItem({ order, compact }: { order: OrderSummary; compact?: boolean }) {
  const { t, i18n } = useTranslation();
  return (
    <Box
      component="li"
      sx={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: compact
          ? '1fr auto'
          : { xs: '1fr auto', sm: 'minmax(0, 1.4fr) minmax(0, 1fr) 190px 130px' },
        alignItems: 'center',
        columnGap: 3,
        rowGap: 0.5,
        px: compact ? 0 : { xs: 2, sm: 3 },
        py: compact ? 1.5 : 2.5,
        '& + &': { borderTop: 1, borderColor: 'divider' },
        transition: 'background-color 120ms',
        '&:hover': compact ? undefined : { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <AppLink
          to={`/orders/${order.id}`}
          underline="hover"
          sx={{
            fontWeight: 650,
            color: 'text.primary',
            '&::after': { content: '""', position: 'absolute', inset: 0 },
          }}
        >
          {order.orderNumber}
        </AppLink>
        <Typography variant="body2" color="textSecondary">
          {t('orders.placedOn', { date: formatDate(order.createdAt, i18n.language) })}
          {compact && ` · ${t('orders.itemCount', { count: order.itemCount })}`}
        </Typography>
      </Box>
      {!compact && (
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          {t('orders.itemCount', { count: order.itemCount })}
        </Typography>
      )}
      <Box sx={{ justifySelf: 'end', gridRow: compact ? undefined : { xs: 'span 2', sm: 'auto' } }}>
        <OrderStatusChip status={order.status} />
      </Box>
      <Typography
        sx={{
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          justifySelf: { xs: 'start', sm: 'end' },
          gridColumn: compact ? '1 / -1' : undefined,
          display: compact ? 'none' : undefined,
        }}
      >
        {formatMoney(order.totalCents, order.currency, i18n.language)}
      </Typography>
    </Box>
  );
}
