import type { ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { RequireAnyPermission, RequireAuth } from '@/features/auth/guards';
import { ADMIN_AREA_PERMISSIONS } from '@/features/auth/permissions';
import { StoreLayout } from './layout/StoreLayout';
import { NotFoundPage } from './pages/NotFoundPage';
import { RouteErrorBoundary } from './pages/RouteErrorBoundary';

/**
 * Lazily loads a page module and picks its named export. Every page is its own chunk, so the
 * first visit only downloads the page being opened.
 */
function page<M extends Record<K, ComponentType>, K extends string>(
  load: () => Promise<M>,
  name: K,
) {
  return async () => ({ Component: (await load())[name] });
}

export const routes: RouteObject[] = [
  {
    element: <StoreLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        // Second boundary inside the layout: a crashing page keeps the header and footer.
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, lazy: page(() => import('@/features/home/HomePage'), 'HomePage') },
          {
            path: 'products',
            lazy: page(() => import('@/features/catalog/pages/ProductsPage'), 'ProductsPage'),
          },
          {
            path: 'products/:slug',
            lazy: page(
              () => import('@/features/catalog/pages/ProductDetailPage'),
              'ProductDetailPage',
            ),
          },
          {
            path: 'categories/:slug',
            lazy: page(() => import('@/features/catalog/pages/CategoryPage'), 'CategoryPage'),
          },
          { path: 'cart', lazy: page(() => import('@/features/cart/pages/CartPage'), 'CartPage') },
          {
            path: 'wishlist',
            lazy: page(() => import('@/features/wishlist/pages/WishlistPage'), 'WishlistPage'),
          },
          {
            path: 'login',
            lazy: page(() => import('@/features/auth/pages/LoginPage'), 'LoginPage'),
          },
          {
            path: 'register',
            lazy: page(() => import('@/features/auth/pages/RegisterPage'), 'RegisterPage'),
          },
          {
            // Signed-in customers only. UX only: the API enforces authentication on its own.
            element: <RequireAuth />,
            children: [
              {
                path: 'checkout',
                lazy: page(() => import('@/features/checkout/pages/CheckoutPage'), 'CheckoutPage'),
              },
              {
                path: 'orders',
                lazy: page(() => import('@/features/orders/pages/OrdersPage'), 'OrdersPage'),
              },
              {
                path: 'orders/:orderId',
                lazy: page(
                  () => import('@/features/orders/pages/OrderDetailPage'),
                  'OrderDetailPage',
                ),
              },
              {
                path: 'profile',
                lazy: page(() => import('@/features/account/pages/ProfilePage'), 'ProfilePage'),
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
  {
    path: 'admin',
    element: <RequireAnyPermission anyOf={ADMIN_AREA_PERMISSIONS} />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        // The back office is only downloaded by people allowed to open it.
        lazy: page(() => import('./layout/AdminLayout'), 'AdminLayout'),
        children: [
          {
            errorElement: <RouteErrorBoundary />,
            children: [
              {
                index: true,
                lazy: page(
                  () => import('@/features/admin/pages/AdminDashboardPage'),
                  'AdminDashboardPage',
                ),
              },
              {
                path: 'products',
                lazy: page(
                  () => import('@/features/admin/pages/AdminProductsPage'),
                  'AdminProductsPage',
                ),
              },
              {
                path: 'categories',
                lazy: page(
                  () => import('@/features/admin/pages/AdminCategoriesPage'),
                  'AdminCategoriesPage',
                ),
              },
              {
                path: 'inventory',
                lazy: page(
                  () => import('@/features/admin/pages/AdminInventoryPage'),
                  'AdminInventoryPage',
                ),
              },
              {
                path: 'orders',
                lazy: page(
                  () => import('@/features/admin/pages/AdminOrdersPage'),
                  'AdminOrdersPage',
                ),
              },
              {
                path: 'users',
                lazy: page(() => import('@/features/admin/pages/AdminUsersPage'), 'AdminUsersPage'),
              },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
