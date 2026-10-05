import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { AppProviders } from '@/app/AppProviders';
import { routes as appRoutes } from '@/app/router';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
}

interface RenderAppOptions {
  /** Initial URL. */
  route?: string;
  /** Defaults to the real application routes. */
  routes?: RouteObject[];
  queryClient?: QueryClient;
}

/** Renders the real app (providers + routes) at a URL, the way a user would arrive at it. */
export function renderApp({
  route = '/',
  routes = appRoutes,
  queryClient = createTestQueryClient(),
}: RenderAppOptions = {}) {
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const user = userEvent.setup();
  const result = render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...result, user, router, queryClient };
}

/** Renders a single component inside the providers and a router at `route`. */
export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    queryClient = createTestQueryClient(),
    ...options
  }: RenderAppOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  return renderApp({ route, queryClient, routes: [{ path: '*', element: ui }], ...options });
}
