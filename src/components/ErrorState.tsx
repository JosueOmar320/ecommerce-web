import ErrorOutline from '@mui/icons-material/ErrorOutlineOutlined';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import { EmptyState } from './EmptyState';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  headingLevel?: 'h2' | 'h3';
}

/** Friendly, non-technical error message with an optional retry. Announced to screen readers. */
export function ErrorState({ title, description, onRetry, headingLevel }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div role="alert">
      <EmptyState
        icon={<ErrorOutline />}
        title={title ?? t('errors.genericTitle')}
        description={description ?? t('errors.genericBody')}
        headingLevel={headingLevel}
        action={
          onRetry && (
            <Button variant="outlined" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          )
        }
      />
    </div>
  );
}
