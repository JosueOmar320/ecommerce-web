import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useId, type ReactNode } from 'react';

interface AccountSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

/** A titled card that is also a labelled region, so screen readers can jump between sections. */
export function AccountSection({ title, description, action, children }: AccountSectionProps) {
  const headingId = useId();
  return (
    <Paper
      variant="outlined"
      component="section"
      aria-labelledby={headingId}
      sx={{ p: { xs: 2, sm: 3 } }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box>
          <Typography id={headingId} variant="h6" component="h2">
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children}
    </Paper>
  );
}
