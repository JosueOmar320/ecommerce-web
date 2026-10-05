import Alert, { type AlertProps } from '@mui/material/Alert';
import { forwardRef } from 'react';

/** Form-level message (e.g. "wrong password"). role=alert so it is announced when it appears. */
export const FormAlert = forwardRef<HTMLDivElement, AlertProps>(function FormAlert(props, ref) {
  return (
    <Alert ref={ref} role="alert" variant="outlined" severity="error" sx={{ mb: 2.5 }} {...props} />
  );
});
