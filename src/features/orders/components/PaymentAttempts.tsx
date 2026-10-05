import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import type { Payment } from '@/api/schema';
import { formatDateTime, formatMoney } from '@/lib/format';

const KNOWN_FAILURES = ['card_declined', 'insufficient_funds'] as const;
const isKnownFailure = (reason: string): reason is (typeof KNOWN_FAILURES)[number] =>
  (KNOWN_FAILURES as readonly string[]).includes(reason);

/** Every payment attempt for the order, newest first, as returned by the API. */
export function PaymentAttempts({ payments }: { payments: Payment[] }) {
  const { t, i18n } = useTranslation();
  if (payments.length === 0) {
    return <Typography color="textSecondary">{t('orders.noPayments')}</Typography>;
  }
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {payments.map((payment) => (
        <Box
          component="li"
          key={payment.id}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
            py: 1.25,
            '& + &': { borderTop: 1, borderColor: 'divider' },
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 600 }}>
              {t(`orders.paymentStatus.${payment.status}`)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {formatDateTime(payment.createdAt, i18n.language)}
            </Typography>
            {payment.status === 'FAILED' && (
              <Typography variant="body2" color="textSecondary">
                {t('orders.paymentFailure', {
                  reason:
                    payment.failureReason && isKnownFailure(payment.failureReason)
                      ? t(`checkout.failureReasons.${payment.failureReason}`)
                      : t('checkout.failureReasons.unknown'),
                })}
              </Typography>
            )}
          </Box>
          <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatMoney(payment.amountCents, payment.currency, i18n.language)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
