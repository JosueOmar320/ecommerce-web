import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import type { OrderStatusChange } from '@/api/schema';
import { formatDateTime } from '@/lib/format';

/** Every status change in order, with the note left by whoever made it. */
export function StatusHistory({ history }: { history: OrderStatusChange[] }) {
  const { t, i18n } = useTranslation();
  return (
    <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
      {history.map((change) => (
        <Box component="li" key={change.createdAt + change.toStatus} sx={{ py: 0.5 }}>
          <Typography variant="body2">
            {t('orders.historyEntry', {
              status: t(`orders.status.${change.toStatus}`),
              date: formatDateTime(change.createdAt, i18n.language),
            })}
          </Typography>
          {change.reason && (
            <Typography variant="body2" color="textSecondary">
              {change.reason}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
