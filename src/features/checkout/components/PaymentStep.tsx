import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/api/errors';
import type { Order } from '@/api/schema';
import { ErrorState } from '@/components/ErrorState';
import { OrderTotals } from '@/components/OrderTotals';
import {
  createPayment,
  latestPayment,
  orderKeys,
  orderPaymentsQuery,
  orderQuery,
} from '@/features/orders/api';
import { getErrorMessage } from '@/lib/errorMessage';
import { formatMoney } from '@/lib/format';
import { clearIdempotencyKey, getIdempotencyKey } from '@/lib/idempotency';
import { StepHeading } from './StepHeading';

/** Test payment methods understood by the API's simulated provider. */
const METHODS = [
  'mock_card_success',
  'mock_card_declined',
  'mock_card_insufficient_funds',
] as const;
type Method = (typeof METHODS)[number];
const POLL_MS = 1_500;

interface PaymentStepProps {
  orderId: string;
  onConfirmed: (order: Order) => void;
}

export function PaymentStep({ orderId, onConfirmed }: PaymentStepProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<Method>('mock_card_success');
  const keyScope = `payment-${orderId}`;

  const payments = useQuery({
    ...orderPaymentsQuery(orderId),
    // Poll while the provider has not answered yet (its webhook arrives asynchronously).
    refetchInterval: (query) =>
      latestPayment(query.state.data)?.status === 'PENDING' ? POLL_MS : false,
  });
  const waiting = latestPayment(payments.data)?.status === 'PENDING';
  const order = useQuery({ ...orderQuery(orderId), refetchInterval: waiting ? POLL_MS : false });

  const pay = useMutation({
    mutationFn: () => createPayment(orderId, method, getIdempotencyKey(keyScope)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.payments(orderId) }),
    onError: (error) => {
      // A provider timeout (502) keeps the same key: retrying resumes the same payment.
      if (!(isApiError(error) && error.status === 502)) clearIdempotencyKey(keyScope);
    },
  });

  const latest = latestPayment(payments.data);
  useEffect(() => {
    if (latest?.status === 'FAILED') clearIdempotencyKey(keyScope); // next attempt is a new payment
  }, [latest?.status, keyScope]);

  useEffect(() => {
    if (order.data?.status === 'CONFIRMED' || latest?.status === 'COMPLETED') {
      clearIdempotencyKey(keyScope);
      void order.refetch().then((r) => {
        if (r.data && r.data.status !== 'PENDING') onConfirmed(r.data);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to status changes only
  }, [order.data?.status, latest?.status]);

  if (order.isPending || payments.isPending) return <Skeleton variant="rectangular" height={320} />;
  if (order.isError) {
    return (
      <ErrorState
        headingLevel="h3"
        title={t('checkout.orderNotFound')}
        description={getErrorMessage(order.error, t)}
      />
    );
  }
  const data = order.data;
  const money = (cents: number) => formatMoney(cents, data.currency, i18n.language);

  if (data.status !== 'PENDING') {
    return (
      <Alert severity="info" variant="outlined">
        {t('checkout.orderExpired')}
      </Alert>
    );
  }

  const reason = latest?.failureReason;
  const failureText =
    reason === 'card_declined' || reason === 'insufficient_funds'
      ? t(`checkout.failureReasons.${reason}`)
      : t('checkout.failureReasons.unknown');

  return (
    <div>
      <StepHeading>{t('checkout.paymentTitle')}</StepHeading>

      <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
        <AlertTitle>{t('checkout.testModeTitle')}</AlertTitle>
        {t('checkout.testModeBody')}
      </Alert>

      {data.expiresAt && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          {t('checkout.payBefore', {
            time: new Intl.DateTimeFormat(i18n.language, { timeStyle: 'short' }).format(
              new Date(data.expiresAt),
            ),
          })}
        </Typography>
      )}

      {latest?.status === 'FAILED' && !pay.isPending && (
        <Alert severity="error" variant="outlined" sx={{ mb: 3 }} role="alert">
          {t('checkout.paymentFailed', { reason: failureText })}
        </Alert>
      )}
      {pay.isError && (
        <Alert severity="error" variant="outlined" sx={{ mb: 3 }} role="alert">
          {getErrorMessage(pay.error, t)}
        </Alert>
      )}

      {waiting ? (
        <Box role="status" sx={{ py: 3 }}>
          <Typography sx={{ mb: 1.5 }}>{t('checkout.confirming')}</Typography>
          <LinearProgress />
        </Box>
      ) : (
        <>
          <FormControl>
            <FormLabel id="payment-method" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
              {t('checkout.paymentMethod')}
            </FormLabel>
            <RadioGroup
              aria-labelledby="payment-method"
              value={method}
              onChange={(_, value) => {
                if ((METHODS as readonly string[]).includes(value)) setMethod(value as Method);
              }}
            >
              {METHODS.map((m) => (
                <FormControlLabel
                  key={m}
                  value={m}
                  control={<Radio />}
                  label={t(`checkout.methods.${m}`)}
                />
              ))}
            </RadioGroup>
          </FormControl>
          <Box sx={{ mt: 3, mb: 3 }}>
            <OrderTotals {...data} />
          </Box>
          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={pay.isPending}
            onClick={() => {
              pay.mutate();
            }}
          >
            {pay.isPending
              ? t('checkout.paying')
              : t('checkout.pay', { total: money(data.totalCents) })}
          </Button>
        </>
      )}
    </div>
  );
}
