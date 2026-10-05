import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { CurrentUser } from '@/api/schema';
import { FormAlert } from '@/components/form/FormAlert';
import { useNotify } from '@/components/Notifications';
import { getErrorMessage } from '@/lib/errorMessage';
import { formatDate } from '@/lib/format';
import { applyServerFieldErrors } from '@/lib/serverErrors';
import { useUpdateProfile } from '../api';

const FIELDS = ['firstName', 'lastName'] as const;

export function PersonalInfoForm({ user }: { user: CurrentUser }) {
  const { t, i18n } = useTranslation();
  const notify = useNotify();
  const update = useUpdateProfile();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => {
    const name = z
      .string()
      .trim()
      .min(1, t('auth.validation.nameRequired'))
      .max(100, t('address.validation.tooLong'));
    return z.object({ firstName: name, lastName: name });
  }, [t]);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        try {
          const saved = await update.mutateAsync(values);
          reset({ firstName: saved.firstName, lastName: saved.lastName });
          notify({ message: t('profile.saved') });
        } catch (error) {
          if (!applyServerFieldErrors(error, setError, FIELDS, t('errors.api.VALIDATION_ERROR'))) {
            setFormError(getErrorMessage(error, t));
          }
        }
      })}
    >
      {formError && <FormAlert>{formError}</FormAlert>}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...register('firstName')}
            label={t('auth.firstName')}
            autoComplete="given-name"
            required
            error={Boolean(errors.firstName)}
            helperText={errors.firstName?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...register('lastName')}
            label={t('auth.lastName')}
            autoComplete="family-name"
            required
            error={Boolean(errors.lastName)}
            helperText={errors.lastName?.message}
          />
        </Grid>
      </Grid>
      <Box component="dl" sx={{ m: 0, mt: 2.5, '& dd': { m: 0 } }}>
        <Box>
          <Typography component="dt" variant="body2" color="textSecondary">
            {t('auth.email')}
          </Typography>
          <Typography component="dd" sx={{ fontWeight: 500 }}>
            {user.email}
          </Typography>
          <Typography component="dd" variant="body2" color="textSecondary">
            {t('profile.emailHint')}
          </Typography>
        </Box>
        <Box sx={{ mt: 1.5 }}>
          <Typography component="dt" variant="body2" color="textSecondary">
            {t('profile.memberSince')}
          </Typography>
          <Typography component="dd">
            {formatDate(user.createdAt, i18n.language, 'long')}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
        <Button type="submit" variant="contained" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? t('common.saving') : t('profile.saveChanges')}
        </Button>
      </Box>
    </form>
  );
}
