import Box from '@mui/material/Box';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import type { ReactNode } from 'react';

/** Row of list controls (search, selects); wraps on narrow screens. */
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <Box
      role="search"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1.5,
        alignItems: 'center',
        mb: 2,
      }}
    >
      {children}
    </Box>
  );
}

/** A compact select for a FilterBar (the theme makes text fields full-width by default). */
export function FilterSelect(props: Omit<TextFieldProps, 'select' | 'size' | 'sx' | 'slotProps'>) {
  return (
    <TextField
      {...props}
      select
      size="small"
      fullWidth={false}
      // Show the "All" option's label instead of an empty field.
      slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
      sx={{ minWidth: 180, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
    />
  );
}
