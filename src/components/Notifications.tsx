import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grow from '@mui/material/Grow';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Link as RouterLink } from 'react-router';

interface Notification {
  id: number;
  message: string;
  severity?: 'success' | 'info' | 'error';
  action?: { label: string; to: string };
}

type Notify = (notification: Omit<Notification, 'id'>) => void;

const NotifyContext = createContext<Notify | null>(null);

const AUTO_HIDE_MS = 5000;

/**
 * Brief confirmations ("Added to cart") in a single toast. Errors that need attention are shown
 * inline next to the action instead, where they cannot be missed or time out.
 *
 * The toast renders inside a live region that is always mounted: screen readers announce content
 * added to an existing region, but often ignore a region that appears together with its text
 * (which is what a freshly mounted snackbar does).
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Notification | null>(null);
  const notify = useCallback<Notify>((notification) => {
    setCurrent({ ...notification, id: Date.now() });
  }, []);
  const close = useCallback(() => {
    setCurrent(null);
  }, []);
  const value = useMemo(() => notify, [notify]);

  // A toast with an action stays until dismissed: 5 s is too short to reach its button.
  useEffect(() => {
    if (!current || current.action) return;
    const timer = setTimeout(close, AUTO_HIDE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [current, close]);

  return (
    <NotifyContext value={value}>
      {children}
      <Box
        role="status"
        aria-live="polite"
        sx={{
          position: 'fixed',
          zIndex: (theme) => theme.zIndex.snackbar,
          left: '50%',
          bottom: { xs: 16, sm: 24 },
          transform: 'translateX(-50%)',
          width: 'max-content',
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {current && (
          <Grow in appear key={current.id}>
            <Alert
              severity={current.severity ?? 'success'}
              variant="filled"
              role="presentation"
              onClose={close}
              action={
                current.action && (
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
              sx={{ minWidth: { sm: 300 }, alignItems: 'center', boxShadow: 6 }}
            >
              {current.message}
            </Alert>
          </Grow>
        )}
      </Box>
    </NotifyContext>
  );
}

export function useNotify(): Notify {
  const notify = use(NotifyContext);
  if (!notify) throw new Error('useNotify must be used inside <NotificationsProvider>');
  return notify;
}
