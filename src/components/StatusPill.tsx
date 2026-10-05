import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'primary';

const DOT: Record<StatusTone, string> = {
  neutral: 'text.disabled',
  info: 'info.main',
  success: 'success.main',
  warning: 'warning.main',
  error: 'error.main',
  primary: 'primary.main',
};

/**
 * Status label with a decorative colored dot: the text carries the meaning (never color alone),
 * and keeps full text contrast in both color schemes.
 */
export function StatusPill({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1,
        py: 0.25,
        border: 1,
        borderColor: 'divider',
        borderRadius: 999,
        typography: 'body2',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        component="span"
        aria-hidden
        sx={{ width: 8, height: 8, flexShrink: 0, borderRadius: '50%', bgcolor: DOT[tone] }}
      />
      {children}
    </Box>
  );
}
