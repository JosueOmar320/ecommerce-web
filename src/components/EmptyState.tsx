import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Heading level used for the title, to fit the surrounding outline. */
  headingLevel?: 'h2' | 'h3';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  headingLevel = 'h2',
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        px: 2,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      {icon && (
        <Box aria-hidden sx={{ color: 'text.secondary', '& svg': { fontSize: 40 } }}>
          {icon}
        </Box>
      )}
      <Typography variant="h4" component={headingLevel}>
        {title}
      </Typography>
      {description && (
        <Typography color="textSecondary" sx={{ maxWidth: 440 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
    </Box>
  );
}
