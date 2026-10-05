import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { isApiError } from '@/api/errors';
import { FormAlert } from '@/components/form/FormAlert';
import { PasswordField } from '@/components/form/PasswordField';
import { useSession } from '@/features/auth/session';
import { getErrorMessage } from '@/lib/errorMessage';
import { applyServerFieldErrors } from '@/lib/serverErrors';
import { changePassword } from '../api';

const FIELDS = ['currentPassword', 'newPassword'] as const;

/**
 * On success the API revokes every session, so this browser signs out as well; the login page
 * explains why (see SessionEndReason).
 */
export function ChangePasswordForm() {
  const { t } = useTranslation();
  const { logout } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, t('auth.validation.passwordRequired')).max(128),
          newPassword: z
            .string()
            .min(8, t('auth.validation.passwordTooShort'))
            .max(128, t('auth.validation.passwordTooLong')),
          confirmPassword: z.string(),
        })
        .refine((v) => v.newPassword === v.confirmPassword, {
          path: ['confirmPassword'],
          message: t('profile.passwordMismatch'),
        })
        .refine((v) => v.newPassword !== v.currentPassword, {
          path: ['newPassword'],
          message: t('profile.passwordSame'),
        }),
    [t],
  );
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async ({ currentPassword, newPassword }) => {
        setFormError(null);
        try {
          await changePassword({ currentPassword, newPassword });
        } catch (error) {
          if (isApiError(error) && error.code === 'INVALID_CREDENTIALS') {
            setError(
              'currentPassword',
              { message: t('profile.currentPasswordWrong') },
              { shouldFocus: true },
            );
          } else if (
            !applyServerFieldErrors(error, setError, FIELDS, t('errors.api.VALIDATION_ERROR'))
          ) {
            setFormError(getErrorMessage(error, t));
          }
          return;
        }
        await logout('passwordChanged');
      })}
    >
      {formError && <FormAlert>{formError}</FormAlert>}
      <Stack spacing={2} sx={{ maxWidth: 440 }}>
        <PasswordField
          {...register('currentPassword')}
          label={t('profile.currentPassword')}
          autoComplete="current-password"
          required
          error={Boolean(errors.currentPassword)}
          helperText={errors.currentPassword?.message}
        />
        <PasswordField
          {...register('newPassword')}
          label={t('profile.newPassword')}
          autoComplete="new-password"
          required
          error={Boolean(errors.newPassword)}
          helperText={errors.newPassword?.message ?? t('auth.passwordHint')}
        />
        <PasswordField
          {...register('confirmPassword')}
          label={t('profile.confirmPassword')}
          autoComplete="new-password"
          required
          error={Boolean(errors.confirmPassword)}
          helperText={errors.confirmPassword?.message}
        />
      </Stack>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? t('common.saving') : t('profile.changePassword')}
        </Button>
      </Box>
    </form>
  );
}
