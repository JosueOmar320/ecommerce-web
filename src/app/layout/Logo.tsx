import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';

export function Logo() {
  const { t } = useTranslation();
  return (
    <Box
      component={RouterLink}
      to="/"
      aria-label={`${t('brand.name')} · ${t('nav.home')}`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        color: 'text.primary',
        textDecoration: 'none',
        fontWeight: 750,
        fontSize: '1.2rem',
        letterSpacing: '-0.04em',
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 32 32"
        aria-hidden
        sx={{ width: 26, height: 26, color: 'text.primary', flexShrink: 0 }}
      >
        <rect width="32" height="32" fill="currentColor" />
        <path
          d="M10 8h3v7l6-7h3.8l-6.4 7.2L23 24h-3.8l-5-6.6-1.2 1.4V24h-3z"
          fill="var(--mui-palette-background-default)"
        />
      </Box>
      {t('brand.name')}
    </Box>
  );
}
