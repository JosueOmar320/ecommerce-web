import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';
import { Seo } from '@/components/Seo';
import { NotFoundPage } from './NotFoundPage';

/** Catches render errors and failed lazy-chunk loads below a route, keeping the layout alive. */
export function RouteErrorBoundary() {
  const { t } = useTranslation();
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  console.error(error);

  // A failed dynamic import usually means a new deploy replaced the chunks: reloading fixes it.
  const isChunkError =
    error instanceof TypeError &&
    /dynamically imported module|Importing a module script failed/i.test(error.message);

  return (
    <PageContainer>
      <Seo title={t('errors.genericTitle')} index={false} />
      <ErrorState
        onRetry={() => {
          if (isChunkError) window.location.reload();
          else window.location.assign(window.location.href);
        }}
      />
    </PageContainer>
  );
}
