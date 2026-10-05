import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, Link as RouterLink, useLocation } from 'react-router';
import type { Permission } from '@/api/schema';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { PageLoader } from '@/components/PageLoader';
import { Seo } from '@/components/Seo';
import { loginPath } from '@/lib/safeRedirect';
import { useSession } from './session';

/**
 * Route guards improve UX only: the API enforces every permission on its own, so hiding a page
 * here is never the security boundary.
 */
export function RequireAuth() {
  const { status } = useSession();
  const location = useLocation();
  if (status === 'loading') return <PageLoader />;
  if (status === 'anonymous') {
    return <Navigate to={loginPath(location.pathname + location.search)} replace />;
  }
  return <Outlet />;
}

/** Requires any one of the given permissions (e.g. the admin area needs at least one admin permission). */
export function RequireAnyPermission({ anyOf }: { anyOf: Permission[] }) {
  const { status, hasPermission } = useSession();
  const location = useLocation();
  if (status === 'loading') return <PageLoader />;
  if (status === 'anonymous') {
    return <Navigate to={loginPath(location.pathname + location.search)} replace />;
  }
  if (!anyOf.some((permission) => hasPermission(permission))) return <Forbidden />;
  return <Outlet />;
}

export function Forbidden() {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <Seo title={t('errors.forbiddenTitle')} index={false} />
      <EmptyState
        title={
          <span role="heading" aria-level={1}>
            {t('errors.forbiddenTitle')}
          </span>
        }
        description={t('errors.forbiddenBody')}
        action={
          <Button component={RouterLink} to="/" variant="contained">
            {t('common.goHome')}
          </Button>
        }
      />
    </PageContainer>
  );
}
