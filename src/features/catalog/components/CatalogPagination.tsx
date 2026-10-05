import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation } from 'react-router';

/**
 * Real links (not buttons) for each page: middle-click/open-in-new-tab works and crawlers can
 * follow them. Inside a <nav> landmark with an accessible name.
 */
export function CatalogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const { t } = useTranslation();
  const location = useLocation();
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(location.search);
    if (target === 1) params.delete('page');
    else params.set('page', String(target));
    const query = params.toString();
    return `${location.pathname}${query ? `?${query}` : ''}`;
  };

  return (
    <nav
      aria-label={t('common.pagination')}
      style={{ display: 'flex', justifyContent: 'center', marginTop: 48 }}
    >
      <Pagination
        page={page}
        count={totalPages}
        shape="rounded"
        siblingCount={1}
        getItemAriaLabel={(type, target, selected) =>
          type === 'page'
            ? selected
              ? t('catalog.page', { page: target ?? 1 })
              : t('catalog.goToPage', { page: target ?? 1 })
            : type === 'previous'
              ? t('catalog.previousPage')
              : t('catalog.nextPage')
        }
        renderItem={(item) => (
          <PaginationItem component={RouterLink} to={hrefFor(item.page ?? 1)} {...item} />
        )}
      />
    </nav>
  );
}
