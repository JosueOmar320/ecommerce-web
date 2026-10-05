import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams } from 'react-router';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { getErrorMessage } from '@/lib/errorMessage';
import { categoriesQuery, findCategory } from '../api';
import { ProductListing } from '../components/ProductListing';

export function CategoryPage() {
  const { t } = useTranslation();
  const { slug = '' } = useParams();
  const categories = useQuery(categoriesQuery);
  const category = categories.data ? findCategory(categories.data, slug) : undefined;
  const fixed = useMemo(() => ({ category: slug }), [slug]);

  if (categories.isPending) {
    return (
      <PageContainer>
        <Skeleton variant="text" width="30%" height={64} />
      </PageContainer>
    );
  }
  if (categories.isError) {
    return (
      <PageContainer>
        <ErrorState
          description={getErrorMessage(categories.error, t)}
          onRetry={() => void categories.refetch()}
        />
      </PageContainer>
    );
  }
  if (!category) return <NotFoundPage />;

  return (
    <PageContainer>
      <Seo title={category.name} description={category.description ?? undefined} />
      <PageHeader
        eyebrow={t('nav.categories')}
        title={category.name}
        description={category.description}
      />
      {category.children.length > 0 && (
        <Stack
          direction="row"
          useFlexGap
          spacing={1}
          sx={{ flexWrap: 'wrap', mb: 4 }}
          component="nav"
          aria-label={t('catalog.subcategories')}
        >
          {category.children.map((child) => (
            <Chip
              key={child.id}
              label={child.name}
              component={RouterLink}
              to={`/categories/${child.slug}`}
              clickable
              variant="outlined"
            />
          ))}
        </Stack>
      )}
      <ProductListing fixed={fixed} />
    </PageContainer>
  );
}
