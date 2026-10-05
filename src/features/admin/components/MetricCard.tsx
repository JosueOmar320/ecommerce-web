import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { AppLink } from '@/components/AppLink';

interface MetricCardProps {
  label: string;
  value: number | undefined;
  hint: string;
  /** Filtered list behind the number; the label is the card's single link. */
  to: string;
  isError?: boolean;
}

export function MetricCard({ label, value, hint, to, isError }: MetricCardProps) {
  const { i18n } = useTranslation();
  return (
    <Paper
      variant="outlined"
      component="li"
      sx={{
        position: 'relative',
        p: 2.5,
        listStyle: 'none',
        transition: 'border-color 120ms',
        '&:hover': { borderColor: 'text.secondary' },
        '&:focus-within': { borderColor: 'primary.main' },
      }}
    >
      <AppLink
        to={to}
        underline="none"
        sx={{
          color: 'text.secondary',
          fontWeight: 600,
          typography: 'body2',
          '&::after': { content: '""', position: 'absolute', inset: 0 },
          '&:focus-visible': { outline: 'none' },
        }}
      >
        {label}
      </AppLink>
      <Typography
        component="p"
        sx={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', my: 0.5 }}
      >
        {isError ? (
          '—'
        ) : value === undefined ? (
          <Skeleton width={64} />
        ) : (
          value.toLocaleString(i18n.language)
        )}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {hint}
      </Typography>
    </Paper>
  );
}
