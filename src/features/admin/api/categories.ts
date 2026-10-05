import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/api/client';
import type { CategoryNode, CreateCategoryRequest } from '@/api/schema';
import { catalogKeys } from '@/features/catalog/api';
import { adminKeys } from './keys';

/** The whole tree including inactive categories (requires `categories:update`). */
export const adminCategoriesQuery = queryOptions({
  queryKey: adminKeys.categories(),
  queryFn: async () =>
    (
      await unwrap(
        api.GET('/api/v1/categories', { params: { query: { includeInactive: 'true' } } }),
      )
    ).data,
});

export interface FlatCategory {
  node: CategoryNode;
  depth: number;
  /** "Parent › Child" path, used where the tree cannot be shown (selects, tables). */
  path: string;
}

/** Depth-first flattening that keeps the API's sort order. */
export function flattenCategories(nodes: CategoryNode[], depth = 0, prefix = ''): FlatCategory[] {
  return nodes.flatMap((node) => {
    const path = prefix ? `${prefix} › ${node.name}` : node.name;
    return [{ node, depth, path }, ...flattenCategories(node.children, depth + 1, path)];
  });
}

/** Ids of a category and all its descendants: invalid parents when moving it. */
export function subtreeIds(node: CategoryNode): string[] {
  return [node.id, ...node.children.flatMap(subtreeIds)];
}

function useCategoryMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.categories() }),
        queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
      ]);
    },
  });
}

export const useCreateCategory = () =>
  useCategoryMutation(
    async (body: CreateCategoryRequest) =>
      (await unwrap(api.POST('/api/v1/categories', { body }))).data,
  );

export const useUpdateCategory = () =>
  useCategoryMutation(
    async ({ id, body }: { id: string; body: Partial<CreateCategoryRequest> }) =>
      (await unwrap(api.PATCH('/api/v1/categories/{id}', { params: { path: { id } }, body }))).data,
  );

export const useDeleteCategory = () =>
  useCategoryMutation(async (id: string) => {
    await unwrap(api.DELETE('/api/v1/categories/{id}', { params: { path: { id } } }));
  });
