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
import { Link as RouterLink } from 'react-router';
import { isApiError } from '@/api/errors';
import type { Order } from '@/api/schema';
import { ErrorState } from '@/components/ErrorState';
import { OrderTotals } from '@/components/OrderTotals';
import {
  createPayment,
  isPaid,
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
/** After this long without an answer, stop polling and let the customer check again. */
const MAX_WAIT_MS = 60_000;

interface PaymentStepProps {
  orderId: string;
  onConfirmed: (order: Order) => void;
}

export function PaymentStep({ orderId, onConfirmed }: PaymentStepProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<Method>('mock_card_success');
  const keyScope = `payment-${orderId}`;

  // Each "check again" starts a new waiting round with its own time limit.
  const [round, setRound] = useState(0);
  const [timedOutRound, setTimedOutRound] = useState<number | null>(null);
  const [polling, setPolling] = useState(true);

  // Poll while the provider has not answered yet (its webhook arrives asynchronously), but only
  // while the order can still be paid and for a limited time: a lost webhook or an order expired
  // by the API would otherwise keep two requests every 1.5 s going forever.
  const interval = polling ? POLL_MS : false;
  const payments = useQuery({ ...orderPaymentsQuery(orderId), refetchInterval: interval });
  const order = useQuery({ ...orderQuery(orderId), refetchInterval: interval });
  const waiting = latestPayment(payments.data)?.status === 'PENDING';
  const timedOut = timedOutRound === round;
  const shouldPoll = waiting && !timedOut && order.data?.status === 'PENDING';
  if (polling !== shouldPoll) setPolling(shouldPoll);

  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => {
      setTimedOutRound(round);
    }, MAX_WAIT_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [waiting, round]);

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
    if ((order.data && isPaid(order.data.status)) || latest?.status === 'COMPLETED') {
      clearIdempotencyKey(keyScope);
      void order.refetch().then((r) => {
        // Only a paid order is confirmed: a payment that lands after the order expired leaves
        // it CANCELLED (and refunded), which must not look like a success.
        if (r.data && isPaid(r.data.status)) onConfirmed(r.data);
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

  if (isPaid(data.status)) {
    // Paid: the confirmation step is about to open.
    return (
      <Box role="status" sx={{ py: 3 }}>
        <Typography sx={{ mb: 1.5 }}>{t('checkout.confirming')}</Typography>
        <LinearProgress />
      </Box>
    );
  }
  if (data.status !== 'PENDING') {
    return (
      <Alert
        severity="info"
        variant="outlined"
        action={
          <Button component={RouterLink} to={`/orders/${orderId}`} color="inherit" size="small">
            {t('checkout.viewOrder')}
          </Button>
        }
      >
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

      {waiting && timedOut ? (
        <Alert
          severity="warning"
          variant="outlined"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setRound((value) => value + 1);
                void payments.refetch();
                void order.refetch();
              }}
            >
              {t('checkout.checkAgain')}
            </Button>
          }
        >
          {t('checkout.paymentSlow')}
        </Alert>
      ) : waiting ? (
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
