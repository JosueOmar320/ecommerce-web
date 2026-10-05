import type { Permission } from '@/api/schema';

/** Holding any of these makes the admin area relevant to the user (each page checks its own). */
export const ADMIN_AREA_PERMISSIONS: Permission[] = [
  'products:read',
  'products:create',
  'categories:update',
  'inventory:read',
  'orders:read',
  'users:read',
];

/** Permission needed to open each admin section (mirrors the route guards). */
export const ADMIN_SECTION_PERMISSION = {
  products: 'products:read',
  categories: 'categories:update',
  inventory: 'inventory:read',
  orders: 'orders:read',
  users: 'users:read',
} as const satisfies Record<string, Permission>;
