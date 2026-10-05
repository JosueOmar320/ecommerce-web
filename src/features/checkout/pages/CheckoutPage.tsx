import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { ConfirmationStep } from '../components/ConfirmationStep';
import { PaymentStep } from '../components/PaymentStep';
import { ReviewStep } from '../components/ReviewStep';
import { ShippingStep } from '../components/ShippingStep';

const STEPS = ['shipping', 'review', 'payment', 'confirmation'] as const;
type CheckoutStep = (typeof STEPS)[number];

/**
 * Checkout state lives in the URL (?step=…&address=…&order=…): refresh-safe, back/forward
 * aware, and each step validates what it needs instead of trusting earlier steps.
 */
export function CheckoutPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const orderId = params.get('order');
  const addressId = params.get('address');
  const requested = params.get('step') as CheckoutStep | null;

  // Never land on a step whose prerequisites are missing (e.g. a hand-edited URL).
  const step: CheckoutStep =
    requested &&
    STEPS.includes(requested) &&
    (requested === 'shipping' || (requested === 'review' ? addressId : orderId))
      ? requested
      : orderId
        ? 'payment'
        : 'shipping';

  const go = (next: CheckoutStep, extra: Record<string, string> = {}, replace = false) => {
    const nextParams = new URLSearchParams({ ...Object.fromEntries(params), ...extra, step: next });
    setParams(nextParams, { replace });
  };

  return (
    <PageContainer>
      <Seo title={t('checkout.title')} index={false} />
      <PageHeader title={t('checkout.title')} />
      <Box sx={{ maxWidth: 720 }}>
        <Stepper
          activeStep={STEPS.indexOf(step)}
          alternativeLabel
          sx={{ mb: { xs: 4, md: 6 } }}
          aria-label={t('checkout.progress')}
        >
          {STEPS.map((s) => (
            <Step key={s} completed={STEPS.indexOf(s) < STEPS.indexOf(step)}>
              <StepLabel {...(s === step ? { 'aria-current': 'step' as const } : {})}>
                {t(`checkout.steps.${s}`)}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {step === 'shipping' && (
          <ShippingStep
            selectedId={addressId}
            onContinue={(id) => {
              go('review', { address: id });
            }}
          />
        )}
        {step === 'review' && addressId && (
          <ReviewStep
            addressId={addressId}
            onChangeAddress={() => {
              go('shipping');
            }}
            // Replace: going "back" from payment must not offer to place the order again.
            onPlaced={(order) => {
              go('payment', { order: order.id }, true);
            }}
          />
        )}
        {step === 'payment' && orderId && (
          <PaymentStep
            orderId={orderId}
            onConfirmed={() => {
              go('confirmation', {}, true);
            }}
          />
        )}
        {step === 'confirmation' && orderId && <ConfirmationStep orderId={orderId} />}
      </Box>
    </PageContainer>
  );
}
