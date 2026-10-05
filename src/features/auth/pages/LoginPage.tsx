import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { AppLink } from '@/components/AppLink';
import { FormAlert } from '@/components/form/FormAlert';
import { PasswordField } from '@/components/form/PasswordField';
import { PageLoader } from '@/components/PageLoader';
import { Seo } from '@/components/Seo';
import { getErrorMessage } from '@/lib/errorMessage';
import { safeRedirect } from '@/lib/safeRedirect';
import { AuthCard } from '../components/AuthCard';
import { createLoginSchema, type LoginValues } from '../schemas';
import { useSession } from '../session';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { status, login, endReason } = useSession();
  const redirectTo = safeRedirect(params.get('redirect'));
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(() => createLoginSchema(t), [t]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (status === 'loading') return <PageLoader />;
  // Already signed in (e.g. back button after login): continue where they were going.
  if (status === 'authenticated' && !isSubmitting) return <Navigate to={redirectTo} replace />;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
      void navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, t));
    }
  });

  return (
    <AuthCard
      title={t('auth.signInTitle')}
      subtitle={t('auth.signInSubtitle')}
      footer={
        <Typography color="textSecondary">
          {t('auth.noAccount')}{' '}
          <AppLink
            to={`/register${params.get('redirect') ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
          >
            {t('auth.signUpTitle')}
          </AppLink>
        </Typography>
      }
    >
      <Seo title={t('auth.signInTitle')} index={false} />
      {endReason && !formError && (
        <Alert severity="info" variant="outlined" sx={{ mb: 2.5 }}>
          {endReason === 'passwordChanged' ? t('auth.passwordChanged') : t('auth.sessionExpired')}
        </Alert>
      )}
      {!endReason && params.has('redirect') && !formError && (
        <Alert severity="info" variant="outlined" sx={{ mb: 2.5 }}>
          {t('auth.signInRequired')}
        </Alert>
      )}
      {formError && <FormAlert>{formError}</FormAlert>}

      <form onSubmit={onSubmit} noValidate>
        <Stack spacing={2.5}>
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
            autoComplete="current-password"
            required
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? t('common.loading') : t('auth.submitSignIn')}
          </Button>
        </Stack>
      </form>

      {import.meta.env.DEV && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
          {t('auth.devCredentials')}
        </Typography>
      )}
    </AuthCard>
  );
}
