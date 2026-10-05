import Add from '@mui/icons-material/AddOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '@/components/ErrorState';
import { addressesQuery, useCreateAddress } from '@/features/account/api';
import { AddressForm } from '@/features/account/components/AddressForm';
import { formatAddress } from '@/features/account/formatAddress';
import { getErrorMessage } from '@/lib/errorMessage';
import { StepHeading } from './StepHeading';

interface ShippingStepProps {
  selectedId: string | null;
  onContinue: (addressId: string) => void;
}

export function ShippingStep({ selectedId, onContinue }: ShippingStepProps) {
  const { t } = useTranslation();
  const addresses = useQuery(addressesQuery);
  const create = useCreateAddress();
  const [adding, setAdding] = useState(false);
  const [choice, setChoice] = useState<string | null>(selectedId);

  if (addresses.isPending) return <Skeleton variant="rectangular" height={200} />;
  if (addresses.isError) {
    return (
      <ErrorState
        headingLevel="h3"
        description={getErrorMessage(addresses.error, t)}
        onRetry={() => void addresses.refetch()}
      />
    );
  }

  const list = addresses.data;
  const current = choice ?? list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? null;
  const showForm = adding || list.length === 0;

  return (
    <div>
      <StepHeading>{t('checkout.shippingTitle')}</StepHeading>
      {list.length > 0 && (
        <RadioGroup
          aria-label={t('checkout.shipTo')}
          value={current ?? ''}
          onChange={(_, value) => {
            setChoice(value);
          }}
          sx={{ gap: 1.5 }}
        >
          {list.map((address) => (
            <Box
              key={address.id}
              sx={{
                border: 1,
                borderColor: current === address.id ? 'text.primary' : 'divider',
                px: 2,
                py: 1.5,
              }}
            >
              <FormControlLabel
                value={address.id}
                control={<Radio />}
                sx={{ alignItems: 'flex-start', m: 0, width: '100%' }}
                // Inside a <label>: phrasing content only, hence spans throughout.
                label={
                  <Box component="span" sx={{ display: 'block', pt: 0.75 }}>
                    <Typography component="span" sx={{ display: 'block', fontWeight: 600 }}>
                      {address.recipientName}
                      {address.label && ` · ${address.label}`}
                      {address.isDefault && (
                        <Chip
                          component="span"
                          size="small"
                          label={t('checkout.default')}
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    <Typography
                      component="span"
                      variant="body2"
                      color="textSecondary"
                      sx={{ display: 'block' }}
                    >
                      {formatAddress(address)}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          ))}
        </RadioGroup>
      )}

      {showForm ? (
        <Box
          sx={{
            mt: list.length > 0 ? 3 : 0,
            p: { sm: 3 },
            border: { sm: 1 },
            borderColor: { sm: 'divider' },
          }}
        >
          {list.length === 0 && (
            <Typography color="textSecondary" sx={{ mb: 2 }}>
              {t('checkout.noAddresses')}
            </Typography>
          )}
          <AddressForm
            defaultValues={{ isDefault: list.length === 0 }}
            submitLabel={t('checkout.useAddress')}
            onCancel={
              list.length > 0
                ? () => {
                    setAdding(false);
                  }
                : undefined
            }
            onSubmit={async (values) => {
              const address = await create.mutateAsync(values);
              setAdding(false);
              onContinue(address.id);
            }}
          />
        </Box>
      ) : (
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 3, flexWrap: 'wrap' }}
        >
          <Button
            startIcon={<Add />}
            onClick={() => {
              setAdding(true);
            }}
          >
            {t('checkout.addAddress')}
          </Button>
          <Button
            variant="contained"
            size="large"
            disabled={!current}
            onClick={() => {
              if (current) onContinue(current);
            }}
          >
            {t('common.continue')}
          </Button>
        </Box>
      )}
    </div>
  );
}
