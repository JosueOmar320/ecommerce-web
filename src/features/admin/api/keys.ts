/** Under the user-scoped 'admin' root: dropped on logout or account switch. */
export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  products: () => [...adminKeys.all, 'products'] as const,
  productList: (filters: object) => [...adminKeys.products(), 'list', filters] as const,
  product: (id: string) => [...adminKeys.products(), 'detail', id] as const,
  categories: () => [...adminKeys.all, 'categories'] as const,
  inventory: () => [...adminKeys.all, 'inventory'] as const,
  inventoryList: (filters: object) => [...adminKeys.inventory(), 'list', filters] as const,
  movements: (variantId: string, page: number) =>
    [...adminKeys.inventory(), 'movements', variantId, page] as const,
  orders: () => [...adminKeys.all, 'orders'] as const,
  orderList: (filters: object) => [...adminKeys.orders(), 'list', filters] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  userList: (filters: object) => [...adminKeys.users(), 'list', filters] as const,
};

export const ADMIN_PAGE_SIZE = 20;
