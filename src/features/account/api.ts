import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/api/client';
import type { AddressRequest } from '@/api/schema';

export const accountKeys = {
  all: ['account'] as const,
  addresses: () => [...accountKeys.all, 'addresses'] as const,
};

export const addressesQuery = queryOptions({
  queryKey: accountKeys.addresses(),
  queryFn: async () => (await unwrap(api.GET('/api/v1/users/me/addresses'))).data,
});

/** Address writes can change which address is the default, so the list is always refetched. */
function useAddressMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.addresses() }),
  });
}

export const useCreateAddress = () =>
  useAddressMutation(
    async (body: AddressRequest) =>
      (await unwrap(api.POST('/api/v1/users/me/addresses', { body }))).data,
  );

export const useUpdateAddress = () =>
  useAddressMutation(
    async ({ id, body }: { id: string; body: Partial<AddressRequest> }) =>
      (
        await unwrap(
          api.PATCH('/api/v1/users/me/addresses/{id}', { params: { path: { id } }, body }),
        )
      ).data,
  );

export const useDeleteAddress = () =>
  useAddressMutation(async (id: string) => {
    await unwrap(api.DELETE('/api/v1/users/me/addresses/{id}', { params: { path: { id } } }));
  });
