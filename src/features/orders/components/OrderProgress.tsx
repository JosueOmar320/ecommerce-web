import Check from '@mui/icons-material/CheckOutlined';
import Block from '@mui/icons-material/BlockOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import type { Order } from '@/api/schema';
import { visuallyHidden } from '@/lib/a11y';
import { formatDate, formatDateTime } from '@/lib/format';
import { FULFILMENT_STEPS } from '../api';

/**
 * Where the order is on its way to the customer. An ordered list (not a widget): each step says
 * whether it is done or current in text, with the date it was reached from the status history.
 */
export function OrderProgress({ order }: { order: Order }) {
  const { t, i18n } = useTranslation();

  if (order.status === 'CANCELLED') {
    return (
      <Alert severity="info" variant="outlined" icon={<Block fontSize="inherit" />}>
        <Typography sx={{ fontWeight: 600 }}>
          {order.cancelledAt
            ? t('orders.cancelledOn', { date: formatDateTime(order.cancelledAt, i18n.language) })
            : t('orders.status.CANCELLED')}
        </Typography>
        {order.cancellationReason && (
          <Typography variant="body2">
            {t('orders.cancellationReason', { reason: order.cancellationReason })}
          </Typography>
        )}
      </Alert>
    );
  }

  const current = FULFILMENT_STEPS.indexOf(order.status);
  const reachedAt = (status: Order['status']) =>
    order.statusHistory.findLast((change) => change.toStatus === status)?.createdAt;

  return (
    <Box
      component="ol"
      aria-label={t('orders.progress')}
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: `repeat(${FULFILMENT_STEPS.length}, 1fr)` },
        gap: { xs: 0, md: 1 },
      }}
    >
      {FULFILMENT_STEPS.map((step, index) => {
        const done = index < current || (index === current && step === 'DELIVERED');
        const isCurrent = index === current;
        const date = index <= current ? reachedAt(step) : undefined;
        return (
          <Box
            component="li"
            key={step}
            aria-current={isCurrent ? 'step' : undefined}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'row', md: 'column' },
              gap: { xs: 1.5, md: 1 },
              py: { xs: 1, md: 0 },
              position: 'relative',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                aria-hidden
                sx={{
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  border: 2,
                  borderColor: index <= current ? 'primary.main' : 'divider',
                  bgcolor: done ? 'primary.main' : 'transparent',
                  color: 'primary.contrastText',
                  '& svg': { fontSize: 16 },
                }}
              >
                {done ? (
                  <Check />
                ) : isCurrent ? (
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                ) : null}
              </Box>
              <Box
                aria-hidden
                sx={{
                  display: {
                    xs: 'none',
                    md: index === FULFILMENT_STEPS.length - 1 ? 'none' : 'block',
                  },
                  flex: 1,
                  height: 2,
                  bgcolor: index < current ? 'primary.main' : 'divider',
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: isCurrent ? 700 : 500 }}
                color={index <= current ? 'textPrimary' : 'textSecondary'}
              >
                {t(`orders.status.${step}`)}
                {(done || isCurrent) && (
                  <Box component="span" sx={visuallyHidden}>
                    {` (${done ? t('orders.stepCompleted') : t('orders.stepCurrent')})`}
                  </Box>
                )}
              </Typography>
              {date && (
                <Typography variant="caption" color="textSecondary">
                  {formatDate(date, i18n.language)}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
