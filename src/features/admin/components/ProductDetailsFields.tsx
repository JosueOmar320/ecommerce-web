import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/features/auth/session';
import { categoriesQuery } from '@/features/catalog/api';
import { adminCategoriesQuery, flattenCategories } from '../api/categories';
import { PRODUCT_STATUSES } from '../api/products';
import type { ProductDetailsValues } from '../productForm';

/** Name, slug, brand, status, categories and description; used by the create and edit pages. */
export function ProductDetailsFields() {
  const { t } = useTranslation();
  const { hasPermission } = useSession();
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProductDetailsValues>();
  // Inactive categories are only listed for people who can manage them.
  const canManageCategories = hasPermission('categories:update');
  const adminTree = useQuery({ ...adminCategoriesQuery, enabled: canManageCategories });
  const publicTree = useQuery({ ...categoriesQuery, enabled: !canManageCategories });
  const tree = canManageCategories ? adminTree : publicTree;
  const options = useMemo(() => flattenCategories(tree.data ?? []), [tree.data]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <TextField
          {...register('name')}
          label={t('admin.categories.name')}
          required
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Controller
          control={control}
          name="status"
          render={({ field: { ref, ...field } }) => (
            <TextField {...field} inputRef={ref} select label={t('admin.products.status')}>
              {PRODUCT_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {t(`admin.products.statuses.${status}`)}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register('slug')}
          label={t('admin.products.slug')}
          error={Boolean(errors.slug)}
          helperText={errors.slug?.message ?? t('admin.products.slugHint')}
          slotProps={{ htmlInput: { spellCheck: false, autoCapitalize: 'none' } }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register('brand')}
          label={t('admin.products.brand')}
          error={Boolean(errors.brand)}
          helperText={errors.brand?.message}
        />
      </Grid>
      <Grid size={12}>
        <Controller
          control={control}
          name="categoryIds"
          render={({ field }) => (
            <Autocomplete
              multiple
              options={options}
              loading={tree.isPending}
              value={options.filter((option) => field.value.includes(option.node.id))}
              onChange={(_event, selected) => {
                field.onChange(selected.map((option) => option.node.id));
              }}
              onBlur={field.onBlur}
              getOptionLabel={(option) => option.path}
              isOptionEqualToValue={(option, value) => option.node.id === value.node.id}
              filterSelectedOptions
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={field.ref}
                  label={t('admin.products.categories')}
                  error={Boolean(errors.categoryIds)}
                  helperText={errors.categoryIds?.message ?? t('admin.products.categoriesHint')}
                />
              )}
            />
          )}
        />
      </Grid>
      <Grid size={12}>
        <TextField
          {...register('description')}
          label={t('admin.products.description')}
          multiline
          minRows={4}
          error={Boolean(errors.description)}
          helperText={errors.description?.message}
        />
      </Grid>
    </Grid>
  );
}
