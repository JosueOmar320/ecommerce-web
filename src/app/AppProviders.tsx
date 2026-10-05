import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { SessionProvider } from '@/features/auth/session';
import { i18n } from '@/i18n';
import { theme } from '@/theme/theme';

interface AppProvidersProps {
  queryClient: QueryClient;
  children: ReactNode;
}

/** Everything the app needs except the router (tests reuse this with a memory router). */
export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider
        theme={theme}
        defaultMode="system"
        modeStorageKey="kestrel.theme"
        disableTransitionOnChange
      >
        <CssBaseline enableColorScheme />
        <QueryClientProvider client={queryClient}>
          <SessionProvider>{children}</SessionProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
