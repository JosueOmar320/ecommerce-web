import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/app/pages/PlaceholderPage';

export function ProductDetailPage() {
  const { t } = useTranslation();
  return <PlaceholderPage title={t('nav.shop')} />;
}
