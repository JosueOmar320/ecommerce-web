import { zodResolver } from '@hookform/resolvers/zod';
import Add from '@mui/icons-material/AddOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import OpenInNew from '@mui/icons-material/OpenInNewOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { ApiError } from '@/api/errors';
import type { ProductDetail, ProductVariant } from '@/api/schema';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FormAlert } from '@/components/form/FormAlert';
import { useNotify } from '@/components/Notifications';
import { SectionCard } from '@/components/SectionCard';
import { Seo } from '@/components/Seo';
import { StatusPill } from '@/components/StatusPill';
import { useSession } from '@/features/auth/session';
import { visuallyHidden } from '@/lib/a11y';
import { getErrorMessage } from '@/lib/errorMessage';
import { formatMoney } from '@/lib/format';
import {
  adminProductQuery,
  useCreateProduct,
  useDeleteProduct,
  useDeleteVariant,
  useUpdateProduct,
} from '../api/products';
import { BackLink } from '../components/BackLink';
import { DataTable, type Column } from '../components/DataTable';
import { ProductDetailsFields } from '../components/ProductDetailsFields';
import { ProductStatusPill } from '../components/ProductStatusPill';
import { VariantDialog } from '../components/VariantDialog';
import { VariantFields } from '../components/VariantFields';
import {
  createProductDetailsSchema,
  createVariantSchema,
  emptyProductDetails,
  emptyVariant,
  fromProduct,
  toCreateVariant,
  toProductBody,
  type ProductDetailsValues,
  type VariantFormValues,
} from '../productForm';

/** The store sells in a single currency, configured on the API (USD in the seed data). */
const STORE_CURRENCY = 'USD';

export function AdminProductEditorPage() {
  const { productId = '' } = useParams();
  return productId === 'new' ? <NewProduct /> : <EditProduct id={productId} />;
}

function NewProduct() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notify = useNotify();
  const { hasPermission } = useSession();
  const create = useCreateProduct();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      createProductDetailsSchema(t).extend({
        variants: z.array(createVariantSchema(t, { withSku: true })).min(1),
      }),
    [t],
  );
  const form = useForm<ProductDetailsValues & { variants: VariantFormValues[] }>({
    resolver: zodResolver(schema),
    defaultValues: { ...emptyProductDetails, variants: [emptyVariant()] },
  });
  const variants = useFieldArray({ control: form.control, name: 'variants' });

  if (!hasPermission('products:create')) {
    return <ErrorState headingLevel="h2" description={t('errors.forbiddenBody')} />;
  }

  return (
    <>
      <Seo title={t('admin.products.newTitle')} index={false} />
      <BackLink to="/admin/products">{t('admin.products.back')}</BackLink>
      <Typography variant="h3" component="h1" sx={{ mb: 3 }}>
        {t('admin.products.newTitle')}
      </Typography>
      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(async ({ variants: rows, ...details }) => {
            setFormError(null);
            try {
              const product = await create.mutateAsync({
                ...toProductBody(details),
                variants: rows.map(toCreateVariant),
              });
              notify({ message: t('admin.products.createdToast', { name: product.name }) });
              void navigate(`/admin/products/${product.id}`, { replace: true });
            } catch (error) {
              setFormError(getErrorMessage(error, t));
            }
          })}
        >
          <Stack spacing={3} sx={{ maxWidth: 960 }}>
            {formError && <FormAlert>{formError}</FormAlert>}
            <SectionCard title={t('admin.products.details')}>
              <ProductDetailsFields />
            </SectionCard>
            <SectionCard
              title={t('admin.products.variants')}
              description={t('admin.products.variantsHint')}
            >
              <Stack spacing={2}>
                {variants.fields.map((field, index) => (
                  <Paper key={field.id} variant="outlined" sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 650 }}>
                        {t('admin.products.variantN', { index: index + 1 })}
                      </Typography>
                      {variants.fields.length > 1 && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => {
                            variants.remove(index);
                          }}
                        >
                          {t('admin.products.removeVariantN', { index: index + 1 })}
                        </Button>
                      )}
                    </Box>
                    <VariantFields prefix={`variants.${index}.`} currency={STORE_CURRENCY} isNew />
                  </Paper>
                ))}
              </Stack>
              <Button
                startIcon={<Add />}
                sx={{ mt: 2 }}
                onClick={() => {
                  variants.append(emptyVariant());
                }}
              >
                {t('admin.products.addVariant')}
              </Button>
            </SectionCard>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button component={RouterLink} to="/admin/products">
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="contained" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('common.saving') : t('admin.products.create')}
              </Button>
            </Box>
          </Stack>
        </form>
      </FormProvider>
    </>
  );
}

function EditProduct({ id }: { id: string }) {
  const { t } = useTranslation();
  const product = useQuery(adminProductQuery(id));

  if (product.isPending) {
    return (
      <Box aria-busy="true">
        <Skeleton width={320} height={48} />
        <Skeleton variant="rectangular" height={420} sx={{ mt: 3, maxWidth: 960 }} />
      </Box>
    );
  }
  if (product.isError) {
    const missing = product.error instanceof ApiError && [400, 404].includes(product.error.status);
    return (
      <>
        <BackLink to="/admin/products">{t('admin.products.back')}</BackLink>
        {missing ? (
          <EmptyState title={t('admin.products.notFound')} />
        ) : (
          <ErrorState
            description={getErrorMessage(product.error, t)}
            onRetry={() => void product.refetch()}
          />
        )}
      </>
    );
  }
  // Remount the form when another product is opened.
  return <ProductEditor key={product.data.id} product={product.data} />;
}

function ProductEditor({ product }: { product: ProductDetail }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const notify = useNotify();
  const { hasPermission } = useSession();
  const canUpdate = hasPermission('products:update');
  const canDelete = hasPermission('products:delete');
  const update = useUpdateProduct();
  const remove = useDeleteProduct();
  const removeVariant = useDeleteVariant();
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProductVariant | 'new' | null>(null);
  const [removing, setRemoving] = useState<ProductVariant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const schema = useMemo(() => createProductDetailsSchema(t), [t]);
  const form = useForm<ProductDetailsValues>({
    resolver: zodResolver(schema),
    defaultValues: fromProduct(product),
  });
  const money = (cents: number) => formatMoney(cents, product.currency, i18n.language);

  const columns: Column<ProductVariant>[] = [
    {
      id: 'sku',
      header: t('admin.products.sku'),
      hideBelow: 'sm',
      cell: (variant) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          {variant.sku}
        </Typography>
      ),
    },
    {
      id: 'name',
      header: t('admin.products.variantName'),
      cell: (variant) => (
        <>
          {variant.name}
          {/* On phones the SKU column is hidden; show it here instead. */}
          <Typography
            variant="body2"
            sx={{ display: { sm: 'none' }, fontFamily: 'monospace', fontSize: '0.8rem' }}
          >
            {variant.sku}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {Object.entries(variant.attributes)
              .map(([name, value]) => `${name}: ${value}`)
              .join(' · ')}
          </Typography>
        </>
      ),
    },
    {
      id: 'price',
      header: t('admin.products.price'),
      align: 'right',
      cell: (variant) => (
        <>
          {money(variant.priceCents)}
          {variant.compareAtPriceCents !== null && (
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ textDecoration: 'line-through' }}
            >
              {money(variant.compareAtPriceCents)}
            </Typography>
          )}
        </>
      ),
    },
    {
      id: 'available',
      header: t('admin.products.available'),
      align: 'right',
      hideBelow: 'sm',
      cell: (variant) => (
        <Typography
          variant="body2"
          sx={{ fontVariantNumeric: 'tabular-nums' }}
          color={variant.availableQuantity === 0 ? 'error' : 'textPrimary'}
        >
          {variant.availableQuantity}
        </Typography>
      ),
    },
    {
      id: 'status',
      header: t('admin.products.status'),
      hideBelow: 'md',
      cell: (variant) => (
        <StatusPill tone={variant.isActive ? 'success' : 'neutral'}>
          {variant.isActive ? t('admin.active') : t('admin.inactive')}
        </StatusPill>
      ),
    },
    {
      id: 'actions',
      header: <span>{t('admin.actions')}</span>,
      align: 'right',
      cell: (variant) =>
        canUpdate || canDelete ? (
          // Icon buttons keep the table narrow enough for phones; names come from aria-label.
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25 }}>
            {canUpdate && (
              <Tooltip title={t('admin.products.editVariant', { sku: variant.sku })}>
                <IconButton
                  size="small"
                  aria-label={t('admin.products.editVariant', { sku: variant.sku })}
                  onClick={() => {
                    setEditing(variant);
                  }}
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title={t('admin.products.removeVariant', { sku: variant.sku })}>
                <IconButton
                  size="small"
                  color="error"
                  aria-label={t('admin.products.removeVariant', { sku: variant.sku })}
                  onClick={() => {
                    setRemoving(variant);
                  }}
                >
                  <DeleteOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ) : null,
    },
  ];

  return (
    <>
      <Seo title={product.name} index={false} />
      <BackLink to="/admin/products">{t('admin.products.back')}</BackLink>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="h3" component="h1">
            {product.name}
          </Typography>
          <ProductStatusPill status={product.status} />
        </Stack>
        {product.status === 'ACTIVE' && (
          <Button
            component={RouterLink}
            to={`/products/${product.slug}`}
            target="_blank"
            endIcon={<OpenInNew />}
          >
            {t('admin.products.viewInStore')}
            <Box component="span" sx={visuallyHidden}>
              {` ${t('common.opensInNewTab')}`}
            </Box>
          </Button>
        )}
      </Stack>

      <Stack spacing={3} sx={{ maxWidth: 960 }}>
        <SectionCard title={t('admin.products.details')}>
          <FormProvider {...form}>
            <form
              noValidate
              onSubmit={form.handleSubmit(async (values) => {
                setFormError(null);
                try {
                  const saved = await update.mutateAsync({
                    id: product.id,
                    body: toProductBody(values),
                  });
                  form.reset(fromProduct(saved));
                  notify({ message: t('admin.products.saved') });
                } catch (error) {
                  setFormError(getErrorMessage(error, t));
                }
              })}
            >
              {formError && <FormAlert>{formError}</FormAlert>}
              <ProductDetailsFields />
              {canUpdate && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!form.formState.isDirty || form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? t('common.saving') : t('profile.saveChanges')}
                  </Button>
                </Box>
              )}
            </form>
          </FormProvider>
        </SectionCard>

        <SectionCard
          title={t('admin.products.variants')}
          action={
            canUpdate && (
              <Button
                startIcon={<Add />}
                onClick={() => {
                  setEditing('new');
                }}
              >
                {t('admin.products.addVariant')}
              </Button>
            )
          }
        >
          <DataTable
            caption={t('admin.products.variants')}
            columns={columns}
            rows={product.variants}
            getRowId={(variant) => variant.id}
            isPending={false}
            empty={null}
          />
        </SectionCard>

        {canDelete && (
          <SectionCard
            title={t('admin.products.delete')}
            description={t('admin.products.deleteBody')}
          >
            <Button
              color="error"
              variant="outlined"
              onClick={() => {
                setDeleting(true);
              }}
            >
              {t('admin.products.delete')}
            </Button>
          </SectionCard>
        )}
      </Stack>

      {editing !== null && (
        <VariantDialog
          key={editing === 'new' ? 'new' : editing.id}
          productId={product.id}
          currency={product.currency}
          variant={editing === 'new' ? undefined : editing}
          onClose={() => {
            setEditing(null);
          }}
        />
      )}
      <ConfirmDialog
        open={removing !== null}
        title={t('admin.products.removeVariantTitle', { sku: removing?.sku ?? '' })}
        description={t('admin.products.removeVariantBody')}
        confirmLabel={t('common.delete')}
        destructive
        pending={removeVariant.isPending}
        onClose={() => {
          setRemoving(null);
        }}
        onConfirm={() => {
          if (!removing) return;
          removeVariant.mutate(
            { productId: product.id, variantId: removing.id },
            {
              onSuccess: () => {
                notify({ message: t('admin.products.variantRemoved', { sku: removing.sku }) });
                setRemoving(null);
              },
              onError: (error) => {
                notify({ message: getErrorMessage(error, t), severity: 'error' });
                setRemoving(null);
              },
            },
          );
        }}
      />
      <ConfirmDialog
        open={deleting}
        title={t('admin.products.deleteTitle', { name: product.name })}
        description={t('admin.products.deleteBody')}
        confirmLabel={t('common.delete')}
        destructive
        pending={remove.isPending}
        onClose={() => {
          setDeleting(false);
        }}
        onConfirm={() => {
          remove.mutate(product.id, {
            onSuccess: () => {
              notify({ message: t('admin.products.deleted', { name: product.name }) });
              void navigate('/admin/products', { replace: true });
            },
            onError: (error) => {
              notify({ message: getErrorMessage(error, t), severity: 'error' });
              setDeleting(false);
            },
          });
        }}
      />
    </>
  );
}
