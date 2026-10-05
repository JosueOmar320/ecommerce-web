import type { CurrentUser } from '@/api/schema';

/** Fixtures are typed with the generated API types: a contract change breaks them at compile time. */
export const customer: CurrentUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'customer@example.com',
  firstName: 'Carlos',
  lastName: 'Customer',
  isActive: true,
  roles: ['CUSTOMER'],
  permissions: [],
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const admin: CurrentUser = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'admin@example.com',
  firstName: 'Ada',
  lastName: 'Admin',
  isActive: true,
  roles: ['ADMIN'],
  permissions: [
    'audit:read',
    'categories:create',
    'categories:delete',
    'categories:update',
    'inventory:adjust',
    'inventory:read',
    'orders:read',
    'orders:update',
    'payments:refund',
    'products:create',
    'products:delete',
    'products:read',
    'products:update',
    'users:read',
    'users:update',
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
};
