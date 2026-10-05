import Add from '@mui/icons-material/AddOutlined';
import Close from '@mui/icons-material/CloseOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useId } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { currencySymbol } from '@/lib/format';

interface VariantFieldsProps {
  /** Path of the variant inside the form: '' for a standalone variant form, 'variants.0.' etc. */
  prefix?: string;
  currency: string;
  /** New variants choose their SKU and initial stock; existing ones cannot change either. */
  isNew: boolean;
}

/**
 * Fields of one variant. Path-based (useFormContext) so the same fields serve the "new product"
 * form (an array of variants) and the add/edit variant dialog.
 */
export function VariantFields({ prefix = '', currency, isNew }: VariantFieldsProps) {
  const { t, i18n } = useTranslation();
  const { register, control, getFieldState, formState } = useFormContext();
  const attributes = useFieldArray({ control, name: `${prefix}attributes` });
  const attributesId = useId();
  const error = (name: string) => getFieldState(`${prefix}${name}`, formState).error?.message;
  const money = {
    input: {
      startAdornment: (
        <InputAdornment position="start">{currencySymbol(currency, i18n.language)}</InputAdornment>
      ),
    },
    htmlInput: { inputMode: 'decimal' as const },
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          {...register(`${prefix}sku`)}
          label={t('admin.products.sku')}
          required={isNew}
          disabled={!isNew}
          error={Boolean(error('sku'))}
          helperText={error('sku') ?? (isNew ? undefined : t('admin.products.skuLocked'))}
          slotProps={{ htmlInput: { spellCheck: false, autoCapitalize: 'characters' } }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          {...register(`${prefix}name`)}
          label={t('admin.products.variantName')}
          error={Boolean(error('name'))}
          helperText={error('name') ?? t('admin.products.variantNameHint')}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: isNew ? 4 : 6 }}>
        <TextField
          {...register(`${prefix}price`)}
          label={t('admin.products.price')}
          required
          error={Boolean(error('price'))}
          helperText={error('price')}
          slotProps={money}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: isNew ? 4 : 6 }}>
        <TextField
          {...register(`${prefix}compareAt`)}
          label={t('admin.products.compareAt')}
          error={Boolean(error('compareAt'))}
          helperText={error('compareAt') ?? t('admin.products.compareAtHint')}
          slotProps={money}
        />
      </Grid>
      {isNew && (
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            {...register(`${prefix}initialStock`)}
            label={t('admin.products.initialStock')}
            error={Boolean(error('initialStock'))}
            helperText={error('initialStock')}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          />
        </Grid>
      )}

      <Grid size={12}>
        {/* A label for the list, not a heading: its level would depend on where the fields sit. */}
        <Typography id={attributesId} variant="subtitle2" sx={{ mb: 1 }}>
          {t('admin.products.attributes')}
        </Typography>
        <Box
          component="ul"
          aria-labelledby={attributesId}
          sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.5 }}
        >
          {attributes.fields.map((field, index) => (
            <Box
              component="li"
              key={field.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto',
                gap: 1,
                alignItems: 'start',
              }}
            >
              <TextField
                {...register(`${prefix}attributes.${index}.name`)}
                size="small"
                label={t('admin.products.attributeName')}
                error={Boolean(error(`attributes.${index}.name`))}
                helperText={error(`attributes.${index}.name`)}
              />
              <TextField
                {...register(`${prefix}attributes.${index}.value`)}
                size="small"
                label={t('admin.products.attributeValue')}
                error={Boolean(error(`attributes.${index}.value`))}
                helperText={error(`attributes.${index}.value`)}
              />
              <IconButton
                aria-label={t('admin.products.removeAttribute', { index: index + 1 })}
                onClick={() => {
                  attributes.remove(index);
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
        <Button
          size="small"
          startIcon={<Add />}
          sx={{ mt: 1 }}
          onClick={() => {
            attributes.append({ name: '', value: '' });
          }}
        >
          {t('admin.products.addAttribute')}
        </Button>
      </Grid>
      <Grid size={12}>
        <Controller
          control={control}
          name={`${prefix}isActive`}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(field.value)}
                  onChange={(event) => {
                    field.onChange(event.target.checked);
                  }}
                />
              }
              label={t('admin.products.availableForSale')}
            />
          )}
        />
      </Grid>
    </Grid>
  );
}
