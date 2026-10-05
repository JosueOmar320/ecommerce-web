import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { PageContainer } from '@/components/PageContainer';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Narrow, focused column for sign-in/sign-up: no distractions, one clear primary action. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <PageContainer>
      <Box sx={{ maxWidth: 420, mx: 'auto', py: { xs: 2, md: 6 } }}>
        <Typography variant="h2" component="h1">
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
          {subtitle}
        </Typography>
        {children}
        <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>{footer}</Box>
      </Box>
    </PageContainer>
  );
}
