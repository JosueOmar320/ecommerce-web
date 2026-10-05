import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/app/pages/PlaceholderPage';

export function HomePage() {
  const { t } = useTranslation();
  return <PlaceholderPage title={t('nav.home')} />;
}
