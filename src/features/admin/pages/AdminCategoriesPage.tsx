import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/app/pages/PlaceholderPage';

export function AdminCategoriesPage() {
  const { t } = useTranslation();
  return <PlaceholderPage title={t('admin.nav.categories')} />;
}
