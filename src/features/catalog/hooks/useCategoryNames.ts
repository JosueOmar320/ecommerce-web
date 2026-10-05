import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CategoryNode } from '@/api/schema';
import { categoriesQuery } from '../api';

/** slug → display name, for labels such as the active-filter chips. */
export function useCategoryNames() {
  const { data } = useQuery(categoriesQuery);
  return useMemo(() => {
    const names = new Map<string, string>();
    const walk = (nodes: CategoryNode[]) => {
      for (const node of nodes) {
        names.set(node.slug, node.name);
        walk(node.children);
      }
    };
    walk(data ?? []);
    return names;
  }, [data]);
}
