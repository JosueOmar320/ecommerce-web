import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const Anchor = styled('a')(({ theme }) => ({
  position: 'absolute',
  left: theme.spacing(2),
  top: theme.spacing(-8),
  zIndex: theme.zIndex.tooltip,
  padding: theme.spacing(1, 2),
  background: (theme.vars ?? theme).palette.text.primary,
  color: (theme.vars ?? theme).palette.background.default,
  fontWeight: 600,
  textDecoration: 'none',
  '&:focus': { top: theme.spacing(1) },
}));

export const MAIN_CONTENT_ID = 'main-content';

/** First focusable element: lets keyboard users jump over the header (WCAG 2.4.1). */
export function SkipLink() {
  const { t } = useTranslation();
  return <Anchor href={`#${MAIN_CONTENT_ID}`}>{t('common.skipToContent')}</Anchor>;
}
