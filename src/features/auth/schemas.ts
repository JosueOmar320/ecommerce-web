import type { TFunction } from 'i18next';
import { z } from 'zod';

/** Mirrors the API's rules (email ≤ 254, password 8–128, names 1–100) so most errors never leave the browser. */
export const createLoginSchema = (t: TFunction) =>
  z.object({
    email: z.email(t('auth.validation.emailInvalid')).max(254),
    password: z.string().min(1, t('auth.validation.passwordRequired')).max(128),
  });

export const createRegisterSchema = (t: TFunction) =>
  z.object({
    firstName: z.string().trim().min(1, t('auth.validation.nameRequired')).max(100),
    lastName: z.string().trim().min(1, t('auth.validation.nameRequired')).max(100),
    email: z.email(t('auth.validation.emailInvalid')).max(254),
    password: z
      .string()
      .min(8, t('auth.validation.passwordTooShort'))
      .max(128, t('auth.validation.passwordTooLong')),
  });

export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterValues = z.infer<ReturnType<typeof createRegisterSchema>>;
