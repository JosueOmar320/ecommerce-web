import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormAlert } from '@/components/form/FormAlert';
import { getErrorMessage } from '@/lib/errorMessage';
import { applyServerFieldErrors } from '@/lib/serverErrors';
import {
  COUNTRIES,
  createAddressSchema,
  emptyAddress,
  type AddressFormInput,
  type AddressFormOutput,
} from '../addressSchema';

const FIELDS = [
  'recipientName',
  'phone',
  'line1',
  'line2',
  'city',
  'state',
  'postalCode',
  'country',
  'label',
] as const;

interface AddressFormProps {
  defaultValues?: Partial<AddressFormInput>;
  submitLabel?: string;
  onSubmit: (values: AddressFormOutput) => Promise<unknown>;
  onCancel?: () => void;
}

export function AddressForm({ defaultValues, submitLabel, onSubmit, onCancel }: AddressFormProps) {
  const { t, i18n } = useTranslation();
  const schema = useMemo(() => createAddressSchema(t), [t]);
  const countryNames = useMemo(
    () => new Intl.DisplayNames([i18n.language], { type: 'region' }),
    [i18n.language],
  );
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormInput, unknown, AddressFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { ...emptyAddress, ...defaultValues },
  });

  const field = (name: (typeof FIELDS)[number], label: string, extra: object = {}) => ({
    ...register(name),
    label,
    error: Boolean(errors[name]),
    helperText: errors[name]?.message,
    ...extra,
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        try {
          await onSubmit(values);
        } catch (error) {
          if (!applyServerFieldErrors(error, setError, FIELDS, t('errors.api.VALIDATION_ERROR'))) {
            setFormError(getErrorMessage(error, t));
          }
        }
      })}
    >
      {formError && <FormAlert>{formError}</FormAlert>}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 7 }}>
          <TextField
            {...field('recipientName', t('address.recipientName'), {
              required: true,
              autoComplete: 'name',
            })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            {...field('phone', t('address.phone'), { type: 'tel', autoComplete: 'tel' })}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            {...field('line1', t('address.line1'), {
              required: true,
              autoComplete: 'address-line1',
            })}
          />
        </Grid>
        <Grid size={12}>
          <TextField {...field('line2', t('address.line2'), { autoComplete: 'address-line2' })} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...field('city', t('address.city'), {
              required: true,
              autoComplete: 'address-level2',
            })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField {...field('state', t('address.state'), { autoComplete: 'address-level1' })} />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            {...field('postalCode', t('address.postalCode'), {
              required: true,
              autoComplete: 'postal-code',
            })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 7 }}>
          <Controller
            control={control}
            name="country"
            render={({ field: { ref, ...rest } }) => (
              <TextField
                {...rest}
                inputRef={ref}
                select
                required
                label={t('address.country')}
                slotProps={{ htmlInput: { autoComplete: 'country' } }}
              >
                {COUNTRIES.map((code) => (
                  <MenuItem key={code} value={code}>
                    {countryNames.of(code) ?? code}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid size={12}>
          <TextField {...field('label', t('address.label'))} />
        </Grid>
        <Grid size={12}>
          <Controller
            control={control}
            name="isDefault"
            render={({ field: { value, onChange } }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={value}
                    onChange={(e) => {
                      onChange(e.target.checked);
                    }}
                  />
                }
                label={t('address.makeDefault')}
              />
            )}
          />
        </Grid>
      </Grid>
      <Stack direction="row" spacing={1.5} sx={{ mt: 3, justifyContent: 'flex-end' }}>
        {onCancel && <Button onClick={onCancel}>{t('common.cancel')}</Button>}
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : (submitLabel ?? t('address.save'))}
        </Button>
      </Stack>
    </form>
  );
}
