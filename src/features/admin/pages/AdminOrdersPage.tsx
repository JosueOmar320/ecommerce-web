import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/app/pages/PlaceholderPage';

export function AdminOrdersPage() {
  const { t } = useTranslation();
  return <PlaceholderPage title={t('admin.nav.orders')} />;
}
