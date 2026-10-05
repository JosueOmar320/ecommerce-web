import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { PageLoader } from '@/components/PageLoader';
import { Seo } from '@/components/Seo';
import { useSession } from '@/features/auth/session';
import { SectionCard } from '@/components/SectionCard';
import { AddressBook } from '../components/AddressBook';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { PersonalInfoForm } from '../components/PersonalInfoForm';
import { RecentOrders } from '../components/RecentOrders';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useSession();
  // RequireAuth guarantees a session; this only covers the instant it is being torn down.
  if (!user) return <PageLoader />;

  return (
    <PageContainer>
      <Seo title={t('profile.title')} index={false} />
      <PageHeader title={t('profile.title')} description={t('profile.subtitle')} />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            <SectionCard title={t('profile.personalTitle')}>
              <PersonalInfoForm user={user} />
            </SectionCard>
            <AddressBook />
            <SectionCard title={t('profile.passwordTitle')} description={t('profile.passwordBody')}>
              <ChangePasswordForm />
            </SectionCard>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <RecentOrders />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
