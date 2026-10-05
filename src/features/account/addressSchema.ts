import type { TFunction } from 'i18next';
import { z } from 'zod';

/** Countries offered in the address form; names are localized with Intl.DisplayNames. */
export const COUNTRIES = [
  'MX',
  'US',
  'CA',
  'ES',
  'AR',
  'CL',
  'CO',
  'PE',
  'GB',
  'DE',
  'FR',
] as const;

const optional = (max: number, t: TFunction) =>
  z
    .string()
    .trim()
    .max(max, t('address.validation.tooLong'))
    .transform((v) => (v ? v : null));

/** Mirrors the API's AddressRequest rules. */
export const createAddressSchema = (t: TFunction) =>
  z.object({
    recipientName: z
      .string()
      .trim()
      .min(1, t('address.validation.required'))
      .max(200, t('address.validation.tooLong')),
    phone: z
      .string()
      .trim()
      .refine((v) => v === '' || /^\+?[0-9 ()-]{7,20}$/.test(v), t('address.validation.phone'))
      .transform((v) => (v ? v : null)),
    line1: z
      .string()
      .trim()
      .min(1, t('address.validation.required'))
      .max(200, t('address.validation.tooLong')),
    line2: optional(200, t),
    city: z
      .string()
      .trim()
      .min(1, t('address.validation.required'))
      .max(100, t('address.validation.tooLong')),
    state: optional(100, t),
    postalCode: z
      .string()
      .trim()
      .min(1, t('address.validation.required'))
      .max(20, t('address.validation.tooLong')),
    country: z.enum(COUNTRIES),
    label: optional(50, t),
    isDefault: z.boolean(),
  });

export type AddressFormInput = z.input<ReturnType<typeof createAddressSchema>>;
export type AddressFormOutput = z.output<ReturnType<typeof createAddressSchema>>;

export const emptyAddress: AddressFormInput = {
  recipientName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'MX',
  label: '',
  isDefault: false,
};
