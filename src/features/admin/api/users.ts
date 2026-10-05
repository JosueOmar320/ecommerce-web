import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, unwrap } from '@/api/client';
import type { Role } from '@/api/schema';
import { ADMIN_PAGE_SIZE, adminKeys } from './keys';

export const ROLES = ['ADMIN', 'CUSTOMER'] as const satisfies readonly Role[];

export const userFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().min(1).max(200).optional().catch(undefined),
  role: z.enum(ROLES).optional().catch(undefined),
  isActive: z.enum(['true', 'false']).optional().catch(undefined),
});
export type UserFilters = z.output<typeof userFiltersSchema>;

export function usersQuery(filters: UserFilters) {
  return queryOptions({
    queryKey: adminKeys.userList(filters),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/api/v1/users', {
          params: { query: { ...filters, pageSize: ADMIN_PAGE_SIZE } },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: { isActive?: boolean; roles?: Role[] };
    }) => (await unwrap(api.PATCH('/api/v1/users/{id}', { params: { path: { id } }, body }))).data,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.users() }),
        queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() }),
      ]),
  });
}
