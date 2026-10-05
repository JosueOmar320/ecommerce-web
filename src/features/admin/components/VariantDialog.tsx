import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useId, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { ProductVariant } from '@/api/schema';
import { FormAlert } from '@/components/form/FormAlert';
import { useNotify } from '@/components/Notifications';
import { getErrorMessage } from '@/lib/errorMessage';
import { useCreateVariant, useUpdateVariant } from '../api/products';
import {
  createVariantSchema,
  emptyVariant,
  fromVariant,
  toCreateVariant,
  toUpdateVariant,
  type VariantFormValues,
} from '../productForm';
import { VariantFields } from './VariantFields';

interface VariantDialogProps {
  productId: string;
  currency: string;
  /** Undefined: add a new variant. */
  variant?: ProductVariant;
  onClose: () => void;
}

/** Mounted per edit (keyed by the caller), so the form always starts from the variant's values. */
export function VariantDialog({ productId, currency, variant, onClose }: VariantDialogProps) {
  const { t } = useTranslation();
  const notify = useNotify();
  const titleId = useId();
  const create = useCreateVariant();
  const update = useUpdateVariant();
  const [formError, setFormError] = useState<string | null>(null);
  const isNew = variant === undefined;
  const schema = useMemo(() => createVariantSchema(t, { withSku: isNew }), [t, isNew]);
  const form = useForm<VariantFormValues>({
    resolver: zodResolver(schema),
    defaultValues: variant ? fromVariant(variant) : emptyVariant(),
  });

  return (
    <Dialog open onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth="sm">
      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            setFormError(null);
            try {
              if (isNew) {
                await create.mutateAsync({ productId, body: toCreateVariant(values) });
              } else {
                await update.mutateAsync({
                  productId,
                  variantId: variant.id,
                  body: toUpdateVariant(values),
                });
              }
              const sku = isNew ? values.sku.trim() : variant.sku;
              notify({
                message: isNew
                  ? t('admin.products.variantCreated', { sku })
                  : t('admin.products.variantSaved', { sku }),
              });
              onClose();
            } catch (error) {
              setFormError(getErrorMessage(error, t));
            }
          })}
        >
          <DialogTitle id={titleId}>
            {isNew
              ? t('admin.products.newVariantTitle')
              : t('admin.products.editVariantTitle', { sku: variant.sku })}
          </DialogTitle>
          <DialogContent dividers>
            {formError && <FormAlert>{formError}</FormAlert>}
            <VariantFields currency={currency} isNew={isNew} />
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
}
