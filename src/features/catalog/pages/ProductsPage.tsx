import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/app/pages/PlaceholderPage';

export function ProductsPage() {
  const { t } = useTranslation();
  return <PlaceholderPage title={t('nav.allProducts')} />;
}
