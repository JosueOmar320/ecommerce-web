import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { Seo } from '@/components/Seo';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <Seo title={t('errors.notFoundTitle')} index={false} />
      <EmptyState
        headingLevel="h2"
        title={
          <span role="heading" aria-level={1}>
            {t('errors.notFoundTitle')}
          </span>
        }
        description={t('errors.notFoundBody')}
        action={
          <Button component={RouterLink} to="/" variant="contained">
            {t('common.goHome')}
          </Button>
        }
      />
    </PageContainer>
  );
}
