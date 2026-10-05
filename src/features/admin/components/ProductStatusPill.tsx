import { useTranslation } from 'react-i18next';
import type { ProductStatus } from '@/api/schema';
import { StatusPill, type StatusTone } from '@/components/StatusPill';

const TONE: Record<ProductStatus, StatusTone> = {
  ACTIVE: 'success',
  DRAFT: 'warning',
  ARCHIVED: 'neutral',
};

export function ProductStatusPill({ status }: { status: ProductStatus }) {
  const { t } = useTranslation();
  return <StatusPill tone={TONE[status]}>{t(`admin.products.statuses.${status}`)}</StatusPill>;
}
