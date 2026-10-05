import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/app/pages/PlaceholderPage';

export function CheckoutPage() {
  const { t } = useTranslation();
  return <PlaceholderPage title={t('nav.cart')} />;
}
