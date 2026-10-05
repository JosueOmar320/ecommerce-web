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
