import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useId, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { CategoryNode } from '@/api/schema';
import { FormAlert } from '@/components/form/FormAlert';
import { useNotify } from '@/components/Notifications';
import { getErrorMessage } from '@/lib/errorMessage';
import {
  flattenCategories,
  subtreeIds,
  useCreateCategory,
  useUpdateCategory,
} from '../api/categories';

const NO_PARENT = '';

export type CategoryDialogState =
  { mode: 'create'; parentId: string | null } | { mode: 'edit'; category: CategoryNode };

interface CategoryDialogProps {
  state: CategoryDialogState;
  tree: CategoryNode[];
  onClose: () => void;
}

/** Create or edit a category; mounted per use, so values always start from the right category. */
export function CategoryDialog({ state, tree, onClose }: CategoryDialogProps) {
  const { t } = useTranslation();
  const notify = useNotify();
  const titleId = useId();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [formError, setFormError] = useState<string | null>(null);
  const editing = state.mode === 'edit' ? state.category : null;

  // A category cannot move under itself or its descendants (the API rejects it too).
  const parents = useMemo(() => {
    const excluded = new Set(editing ? subtreeIds(editing) : []);
    return flattenCategories(tree).filter(({ node }) => !excluded.has(node.id));
  }, [tree, editing]);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t('admin.products.validation.required')).max(100),
        slug: z
          .string()
          .trim()
          .max(120)
          .refine(
            (v) => v === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v),
            t('admin.categories.slugHint'),
          ),
        description: z.string().trim().max(1000),
        parentId: z.string(),
        sortOrder: z
          .string()
          .trim()
          .regex(/^\d{1,5}$/, t('admin.products.validation.integer'))
          .refine((v) => Number(v) <= 10_000, t('admin.products.validation.integer')),
        isActive: z.boolean(),
      }),
    [t],
  );
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: editing
      ? {
          name: editing.name,
          slug: editing.slug,
          description: editing.description ?? '',
          parentId: editing.parentId ?? NO_PARENT,
          sortOrder: String(editing.sortOrder),
          isActive: editing.isActive,
        }
      : {
          name: '',
          slug: '',
          description: '',
          parentId: state.mode === 'create' ? (state.parentId ?? NO_PARENT) : NO_PARENT,
          sortOrder: '0',
          isActive: true,
        },
  });

  return (
    <Dialog open onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth="sm">
      <form
        noValidate
        onSubmit={handleSubmit(async (values) => {
          setFormError(null);
          const body = {
            name: values.name,
            ...(values.slug && { slug: values.slug }),
            description: values.description || null,
            parentId: values.parentId || null,
            sortOrder: Number(values.sortOrder),
            isActive: values.isActive,
          };
          try {
            if (editing) {
              await update.mutateAsync({ id: editing.id, body });
              notify({ message: t('admin.categories.saved') });
            } else {
              const created = await create.mutateAsync(body);
              notify({ message: t('admin.categories.created', { name: created.name }) });
            }
            onClose();
          } catch (error) {
            setFormError(getErrorMessage(error, t));
          }
        })}
      >
        <DialogTitle id={titleId}>
          {editing ? t('admin.categories.editTitle') : t('admin.categories.newTitle')}
        </DialogTitle>
        <DialogContent dividers>
          {formError && <FormAlert>{formError}</FormAlert>}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('name')}
                label={t('admin.categories.name')}
                required
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('slug')}
                label={t('admin.categories.slug')}
                error={Boolean(errors.slug)}
                helperText={errors.slug?.message ?? t('admin.categories.slugHint')}
                slotProps={{ htmlInput: { spellCheck: false, autoCapitalize: 'none' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <Controller
                control={control}
                name="parentId"
                render={({ field: { ref, ...field } }) => (
                  <TextField {...field} inputRef={ref} select label={t('admin.categories.parent')}>
                    <MenuItem value={NO_PARENT}>{t('admin.categories.noParent')}</MenuItem>
                    {parents.map(({ node, depth }) => (
                      <MenuItem key={node.id} value={node.id} sx={{ pl: 2 + depth * 2 }}>
                        {node.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('sortOrder')}
                label={t('admin.categories.sortOrder')}
                error={Boolean(errors.sortOrder)}
                helperText={errors.sortOrder?.message ?? t('admin.categories.sortOrderHint')}
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('description')}
                label={t('admin.categories.description')}
                multiline
                minRows={2}
                error={Boolean(errors.description)}
                helperText={errors.description?.message}
              />
            </Grid>
            <Grid size={12}>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={(event) => {
                          field.onChange(event.target.checked);
                        }}
                      />
                    }
                    label={t('admin.categories.visible')}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
