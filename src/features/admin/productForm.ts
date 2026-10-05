import type { TFunction } from 'i18next';
import { z } from 'zod';
import type {
  CreateVariantRequest,
  ProductDetail,
  ProductVariant,
  UpdateVariantRequest,
} from '@/api/schema';
import { centsToDecimal, decimalToCents } from '@/lib/format';
import { PRODUCT_STATUSES } from './api/products';

/** Mirrors the API's limits (CreateProductRequest / CreateVariantRequest). */
const MAX_PRICE_CENTS = 100_000_000;
const PRICE = /^\d{1,7}(\.\d{1,2})?$/;

const price = (t: TFunction) =>
  z
    .string()
    .trim()
    .regex(PRICE, t('admin.products.validation.price'))
    .refine((v) => decimalToCents(v) <= MAX_PRICE_CENTS, t('admin.products.validation.price'));

const attributesSchema = (t: TFunction) =>
  z
    .array(z.object({ name: z.string().trim().max(50), value: z.string().trim().max(100) }))
    .superRefine((rows, ctx) => {
      const seen = new Set<string>();
      rows.forEach((row, index) => {
        if (!row.name && !row.value) return;
        if (!row.name || !row.value) {
          ctx.addIssue({
            code: 'custom',
            path: [index, row.name ? 'value' : 'name'],
            message: t('admin.products.validation.attributePair'),
          });
        } else if (seen.has(row.name.toLowerCase())) {
          ctx.addIssue({
            code: 'custom',
            path: [index, 'name'],
            message: t('admin.products.validation.attributeDuplicate'),
          });
        }
        seen.add(row.name.toLowerCase());
      });
    });

export const createVariantSchema = (t: TFunction, { withSku }: { withSku: boolean }) =>
  z
    .object({
      sku: withSku
        ? z
            .string()
            .trim()
            .min(2, t('admin.products.validation.sku'))
            .max(64, t('admin.products.validation.sku'))
        : z.string(),
      name: z.string().trim().max(200),
      price: price(t),
      compareAt: z.union([z.literal(''), price(t)]),
      initialStock: z
        .string()
        .trim()
        .regex(/^\d{1,6}$/, t('admin.products.validation.integer'))
        .refine((v) => Number(v) <= 100_000, t('admin.products.validation.integer')),
      isActive: z.boolean(),
      attributes: attributesSchema(t),
    })
    .refine((v) => v.compareAt === '' || decimalToCents(v.compareAt) > decimalToCents(v.price), {
      path: ['compareAt'],
      message: t('admin.products.validation.compareAt'),
    });

export type VariantFormValues = z.input<ReturnType<typeof createVariantSchema>>;

export const emptyVariant = (): VariantFormValues => ({
  sku: '',
  name: '',
  price: '',
  compareAt: '',
  initialStock: '0',
  isActive: true,
  attributes: [{ name: '', value: '' }],
});

const toAttributes = (rows: VariantFormValues['attributes']) =>
  Object.fromEntries(
    rows.filter((row) => row.name && row.value).map((r) => [r.name.trim(), r.value.trim()]),
  );

export function toCreateVariant(values: VariantFormValues): CreateVariantRequest {
  return {
    sku: values.sku.trim(),
    ...(values.name.trim() && { name: values.name.trim() }),
    priceCents: decimalToCents(values.price.trim()),
    compareAtPriceCents: values.compareAt ? decimalToCents(values.compareAt.trim()) : null,
    attributes: toAttributes(values.attributes),
    isActive: values.isActive,
    initialStock: Number(values.initialStock),
  };
}

/** SKU and stock are not editable here: the SKU is immutable, stock moves through inventory. */
export function toUpdateVariant(values: VariantFormValues): UpdateVariantRequest {
  return {
    ...(values.name.trim() && { name: values.name.trim() }),
    priceCents: decimalToCents(values.price.trim()),
    compareAtPriceCents: values.compareAt ? decimalToCents(values.compareAt.trim()) : null,
    attributes: toAttributes(values.attributes),
    isActive: values.isActive,
  };
}

export function fromVariant(variant: ProductVariant): VariantFormValues {
  const attributes = Object.entries(variant.attributes).map(([name, value]) => ({ name, value }));
  return {
    sku: variant.sku,
    name: variant.name,
    price: centsToDecimal(variant.priceCents),
    compareAt:
      variant.compareAtPriceCents === null ? '' : centsToDecimal(variant.compareAtPriceCents),
    initialStock: '0',
    isActive: variant.isActive,
    attributes: attributes.length ? attributes : [{ name: '', value: '' }],
  };
}

export const createProductDetailsSchema = (t: TFunction) =>
  z.object({
    name: z.string().trim().min(1, t('admin.products.validation.required')).max(200),
    slug: z
      .string()
      .trim()
      .max(120)
      .refine(
        (v) => v === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v),
        t('admin.products.slugHint'),
      ),
    brand: z.string().trim().max(100),
    description: z.string().max(10_000),
    status: z.enum(PRODUCT_STATUSES),
    categoryIds: z.array(z.string()).max(10, t('admin.products.categoriesHint')),
  });

export type ProductDetailsValues = z.input<ReturnType<typeof createProductDetailsSchema>>;

export const emptyProductDetails: ProductDetailsValues = {
  name: '',
  slug: '',
  brand: '',
  description: '',
  status: 'DRAFT',
  categoryIds: [],
};

export function fromProduct(product: ProductDetail): ProductDetailsValues {
  return {
    name: product.name,
    slug: product.slug,
    brand: product.brand ?? '',
    description: product.description,
    status: product.status,
    categoryIds: product.categories.map((category) => category.id),
  };
}

/** Empty optional inputs become "unset" (slug generated by the API, brand null). */
export function toProductBody(values: ProductDetailsValues) {
  return {
    name: values.name.trim(),
    ...(values.slug.trim() && { slug: values.slug.trim() }),
    brand: values.brand.trim() || null,
    description: values.description,
    status: values.status,
    categoryIds: values.categoryIds,
  };
}
