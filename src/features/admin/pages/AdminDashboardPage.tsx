import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/app/pages/PlaceholderPage';

export function AdminDashboardPage() {
  const { t } = useTranslation();
  return <PlaceholderPage title={t('admin.nav.dashboard')} />;
}
