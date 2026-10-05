import Typography from '@mui/material/Typography';
import { useEffect, useRef } from 'react';

/** Receives focus when its step appears, so keyboard and screen-reader users land on the new content. */
export function StepHeading({ children }: { children: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <Typography ref={ref} tabIndex={-1} variant="h4" component="h2" sx={{ mb: 3, outline: 'none' }}>
      {children}
    </Typography>
  );
}
