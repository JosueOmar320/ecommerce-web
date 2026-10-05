import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { ProductListing } from '../components/ProductListing';
import { parseFilters } from '../filters';
import { useCategoryNames } from '../hooks/useCategoryNames';

export function ProductsPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { search } = parseFilters(params);
  const categoryNames = useCategoryNames();
  const title = search
    ? t('catalog.searchResultsTitle', { term: search })
    : t('catalog.productsTitle');

  return (
    <PageContainer>
      {/* Search result pages are not indexed; the canonical listing is /products. */}
      <Seo
        title={title}
        description={t('catalog.productsDescription')}
        index={!search}
        canonicalPath="/products"
      />
      <PageHeader
        title={title}
        description={search ? undefined : t('catalog.productsDescription')}
      />
      <ProductListing categoryNames={categoryNames} />
    </PageContainer>
  );
}
