import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';

/** Temporary scaffold for routes whose feature is built in a later phase. */
export function PlaceholderPage({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <Seo title={title} index={false} />
      <PageHeader title={title} />
      <Typography color="text.secondary">{t('placeholder.comingSoon')}</Typography>
    </PageContainer>
  );
}
