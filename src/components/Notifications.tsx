import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';

interface Notification {
  id: number;
  message: string;
  severity?: 'success' | 'info' | 'error';
  action?: { label: string; to: string };
}

type Notify = (notification: Omit<Notification, 'id'>) => void;

const NotifyContext = createContext<Notify | null>(null);

/**
 * Brief confirmations ("Added to cart") in a single, polite snackbar. Errors that need attention
 * are shown inline next to the action instead, where they cannot be missed or time out.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Notification | null>(null);
  const notify = useCallback<Notify>((notification) => {
    setCurrent({ ...notification, id: Date.now() });
  }, []);
  const close = () => {
    setCurrent(null);
  };
  const value = useMemo(() => notify, [notify]);

  return (
    <NotifyContext value={value}>
      {children}
      <Snackbar
        key={current?.id}
        open={current !== null}
        autoHideDuration={5000}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') close();
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={current?.severity ?? 'success'}
          variant="filled"
          onClose={close}
          role={current?.severity === 'error' ? 'alert' : 'status'}
          action={
            current?.action && (
              <Button
                component={RouterLink}
                to={current.action.to}
                color="inherit"
                size="small"
                onClick={close}
              >
                {current.action.label}
              </Button>
            )
          }
          sx={{ minWidth: 300, alignItems: 'center' }}
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </NotifyContext>
  );
}

export function useNotify(): Notify {
  const notify = use(NotifyContext);
  if (!notify) throw new Error('useNotify must be used inside <NotificationsProvider>');
  return notify;
}
