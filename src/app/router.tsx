import { createBrowserRouter, type RouteObject } from 'react-router';
import { StoreLayout } from './layout/StoreLayout';
import { NotFoundPage } from './pages/NotFoundPage';
import { RouteErrorBoundary } from './pages/RouteErrorBoundary';

/**
 * Every page is its own chunk (`lazy`), so the storefront never downloads admin code and the
 * first load only pays for the page being visited.
 */
export const routes: RouteObject[] = [
  {
    element: <StoreLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/features/home/HomePage')).HomePage }),
          },
          {
            path: 'products',
            lazy: async () => ({
              Component: (await import('@/features/catalog/pages/ProductsPage')).ProductsPage,
            }),
          },
          {
            path: 'products/:slug',
            lazy: async () => ({
              Component: (await import('@/features/catalog/pages/ProductDetailPage'))
                .ProductDetailPage,
            }),
          },
          {
            path: 'categories/:slug',
            lazy: async () => ({
              Component: (await import('@/features/catalog/pages/CategoryPage')).CategoryPage,
            }),
          },
          {
            path: 'cart',
            lazy: async () => ({
              Component: (await import('@/features/cart/pages/CartPage')).CartPage,
            }),
          },
          {
            path: 'checkout',
            lazy: async () => ({
              Component: (await import('@/features/checkout/pages/CheckoutPage')).CheckoutPage,
            }),
          },
          {
            path: 'wishlist',
            lazy: async () => ({
              Component: (await import('@/features/wishlist/pages/WishlistPage')).WishlistPage,
            }),
          },
          {
            path: 'orders',
            lazy: async () => ({
              Component: (await import('@/features/orders/pages/OrdersPage')).OrdersPage,
            }),
          },
          {
            path: 'orders/:orderId',
            lazy: async () => ({
              Component: (await import('@/features/orders/pages/OrderDetailPage')).OrderDetailPage,
            }),
          },
          {
            path: 'profile',
            lazy: async () => ({
              Component: (await import('@/features/account/pages/ProfilePage')).ProfilePage,
            }),
          },
          {
            path: 'login',
            lazy: async () => ({
              Component: (await import('@/features/auth/pages/LoginPage')).LoginPage,
            }),
          },
          {
            path: 'register',
            lazy: async () => ({
              Component: (await import('@/features/auth/pages/RegisterPage')).RegisterPage,
            }),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
  {
    path: 'admin',
    // The back office is only downloaded by people who open it.
    lazy: async () => ({ Component: (await import('./layout/AdminLayout')).AdminLayout }),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import('@/features/admin/pages/AdminDashboardPage'))
                .AdminDashboardPage,
            }),
          },
          {
            path: 'products',
            lazy: async () => ({
              Component: (await import('@/features/admin/pages/AdminProductsPage'))
                .AdminProductsPage,
            }),
          },
          {
            path: 'categories',
            lazy: async () => ({
              Component: (await import('@/features/admin/pages/AdminCategoriesPage'))
                .AdminCategoriesPage,
            }),
          },
          {
            path: 'inventory',
            lazy: async () => ({
              Component: (await import('@/features/admin/pages/AdminInventoryPage'))
                .AdminInventoryPage,
            }),
          },
          {
            path: 'orders',
            lazy: async () => ({
              Component: (await import('@/features/admin/pages/AdminOrdersPage')).AdminOrdersPage,
            }),
          },
          {
            path: 'users',
            lazy: async () => ({
              Component: (await import('@/features/admin/pages/AdminUsersPage')).AdminUsersPage,
            }),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
