import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { isApiError } from '@/api/errors';
import { AppLink } from '@/components/AppLink';
import { FormAlert } from '@/components/form/FormAlert';
import { PasswordField } from '@/components/form/PasswordField';
import { PageLoader } from '@/components/PageLoader';
import { Seo } from '@/components/Seo';
import { getErrorMessage } from '@/lib/errorMessage';
import { safeRedirect } from '@/lib/safeRedirect';
import { applyServerFieldErrors } from '@/lib/serverErrors';
import { AuthCard } from '../components/AuthCard';
import { createRegisterSchema, type RegisterValues } from '../schemas';
import { useSession } from '../session';

const FIELDS = ['firstName', 'lastName', 'email', 'password'] as const;

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { status, register: createAccount } = useSession();
  const redirectTo = safeRedirect(params.get('redirect'));
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(() => createRegisterSchema(t), [t]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  if (status === 'loading') return <PageLoader />;
  if (status === 'authenticated' && !isSubmitting) return <Navigate to={redirectTo} replace />;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createAccount(values);
      void navigate(redirectTo, { replace: true });
    } catch (error) {
      if (isApiError(error) && error.code === 'EMAIL_ALREADY_REGISTERED') {
        setError(
          'email',
          { type: 'server', message: getErrorMessage(error, t) },
          { shouldFocus: true },
        );
        return;
      }
      if (applyServerFieldErrors(error, setError, FIELDS, t('errors.api.VALIDATION_ERROR'))) return;
      setFormError(getErrorMessage(error, t));
    }
  });

  return (
    <AuthCard
      title={t('auth.signUpTitle')}
      subtitle={t('auth.signUpSubtitle')}
      footer={
        <Typography color="textSecondary">
          {t('auth.haveAccount')}{' '}
          <AppLink
            to={`/login${params.get('redirect') ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
          >
            {t('auth.signInTitle')}
          </AppLink>
        </Typography>
      }
    >
      <Seo title={t('auth.signUpTitle')} index={false} />
      {formError && <FormAlert>{formError}</FormAlert>}
      <form onSubmit={onSubmit} noValidate>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              {...register('firstName')}
              label={t('auth.firstName')}
              autoComplete="given-name"
              required
              error={Boolean(errors.firstName)}
              helperText={errors.firstName?.message}
            />
            <TextField
              {...register('lastName')}
              label={t('auth.lastName')}
              autoComplete="family-name"
              required
              error={Boolean(errors.lastName)}
              helperText={errors.lastName?.message}
            />
          </Stack>
          <TextField
            {...register('email')}
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            required
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
          />
          <PasswordField
            {...register('password')}
            label={t('auth.password')}
            autoComplete="new-password"
            required
            error={Boolean(errors.password)}
            helperText={errors.password?.message ?? t('auth.passwordHint')}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? t('common.loading') : t('auth.submitSignUp')}
          </Button>
        </Stack>
      </form>
    </AuthCard>
  );
}
