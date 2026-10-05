import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';

/** Small, centered indicator for route-level waits (session restore), not a full-screen blocker. */
export function PageLoader() {
  const { t } = useTranslation();
  return (
    <Box role="status" sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress size={28} aria-label={t('common.loading')} />
    </Box>
  );
}
