import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { FormAlert } from '@/components/form/FormAlert';
import { useNotify } from '@/components/Notifications';
import { getErrorMessage } from '@/lib/errorMessage';
import { useRecordMovement } from '../api/inventory';

/** The movement types a person can record; sales, reservations and releases come from orders. */
const MANUAL_TYPES = ['PURCHASE', 'RETURN', 'ADJUSTMENT'] as const;

export function RecordMovementForm({ variantId, sku }: { variantId: string; sku: string }) {
  const { t } = useTranslation();
  const notify = useNotify();
  const record = useRecordMovement();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z
        .object({
          type: z.enum(MANUAL_TYPES),
          quantity: z
            .string()
            .trim()
            .regex(/^-?\d{1,6}$/, t('admin.inventory.validation.integer')),
          reason: z.string().trim().min(3, t('admin.inventory.validation.reason')).max(500),
        })
        .superRefine((values, ctx) => {
          const quantity = Number(values.quantity);
          if (values.type === 'ADJUSTMENT' && quantity === 0) {
            ctx.addIssue({
              code: 'custom',
              path: ['quantity'],
              message: t('admin.inventory.validation.nonZero'),
            });
          } else if (values.type !== 'ADJUSTMENT' && quantity <= 0) {
            ctx.addIssue({
              code: 'custom',
              path: ['quantity'],
              message: t('admin.inventory.validation.positive'),
            });
          }
        }),
    [t],
  );
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'PURCHASE' as const, quantity: '', reason: '' },
  });
  const type = useWatch({ control, name: 'type' });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        try {
          await record.mutateAsync({
            variantId,
            body: { ...values, quantity: Number(values.quantity) },
          });
          reset({ type: values.type, quantity: '', reason: '' });
          notify({ message: t('admin.inventory.recorded', { sku }) });
        } catch (error) {
          setFormError(getErrorMessage(error, t));
        }
      })}
    >
      {formError && <FormAlert>{formError}</FormAlert>}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            control={control}
            name="type"
            render={({ field: { ref, ...field } }) => (
              <TextField
                {...field}
                inputRef={ref}
                select
                label={t('admin.inventory.movementType')}
                helperText={t(`admin.inventory.typeHints.${type}`)}
              >
                {MANUAL_TYPES.map((value) => (
                  <MenuItem key={value} value={value}>
                    {t(`admin.inventory.types.${value}`)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...register('quantity')}
            label={t('admin.inventory.quantity')}
            required
            error={Boolean(errors.quantity)}
            helperText={errors.quantity?.message}
            slotProps={{ htmlInput: { inputMode: type === 'ADJUSTMENT' ? 'text' : 'numeric' } }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            {...register('reason')}
            label={t('admin.inventory.reason')}
            required
            error={Boolean(errors.reason)}
            helperText={errors.reason?.message ?? t('admin.inventory.reasonHint')}
          />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : t('admin.inventory.record')}
        </Button>
      </Box>
    </form>
  );
}
