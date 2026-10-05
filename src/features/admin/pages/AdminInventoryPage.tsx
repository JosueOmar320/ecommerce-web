import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/app/pages/PlaceholderPage';

export function AdminInventoryPage() {
  const { t } = useTranslation();
  return <PlaceholderPage title={t('admin.nav.inventory')} />;
}
