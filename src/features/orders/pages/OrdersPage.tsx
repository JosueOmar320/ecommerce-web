import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/app/pages/PlaceholderPage';

export function OrdersPage() {
  const { t } = useTranslation();
  return <PlaceholderPage title={t('nav.orders')} />;
}
