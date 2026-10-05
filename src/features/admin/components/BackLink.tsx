import ArrowBack from '@mui/icons-material/ArrowBackOutlined';
import { AppLink } from '@/components/AppLink';

export function BackLink({ to, children }: { to: string; children: string }) {
  return (
    <AppLink
      to={to}
      underline="hover"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        mb: 2,
        color: 'text.secondary',
      }}
    >
      <ArrowBack fontSize="small" aria-hidden />
      {children}
    </AppLink>
  );
}
