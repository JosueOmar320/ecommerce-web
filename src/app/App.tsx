import { useState } from 'react';
// The DOM build of RouterProvider supports flushSync navigations (used by URL filters).
import { RouterProvider } from 'react-router/dom';
import { AppProviders } from './AppProviders';
import { createQueryClient } from './queryClient';
import { createAppRouter } from './router';

export function App() {
  const [queryClient] = useState(createQueryClient);
  const [router] = useState(createAppRouter);
  return (
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
