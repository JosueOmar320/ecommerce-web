import { useTranslation } from 'react-i18next';
import { SearchField } from '@/components/SearchField';

interface CatalogSearchFieldProps {
  value: string | undefined;
  onSearch: (term: string | undefined) => void;
}

/** Search within the listing; the search itself runs on the server (full-text). */
export function CatalogSearchField({ value, onSearch }: CatalogSearchFieldProps) {
  const { t } = useTranslation();
  return <SearchField label={t('catalog.searchWithin')} value={value} onSearch={onSearch} />;
}
