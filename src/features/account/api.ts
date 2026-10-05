import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/api/client';
import type { AddressRequest, CurrentUser } from '@/api/schema';
import { authKeys } from '@/features/auth/api';

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

/** Name changes are reflected immediately in the header, which reads the cached session user. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { firstName: string; lastName: string }) =>
      (await unwrap(api.PATCH('/api/v1/users/me', { body }))).data,
    onSuccess: (user) => {
      queryClient.setQueryData<CurrentUser>(
        authKeys.me,
        (current) => current && { ...current, firstName: user.firstName, lastName: user.lastName },
      );
    },
  });
}

/** The API revokes every session on success; the caller signs this browser out too. */
export const changePassword = async (body: { currentPassword: string; newPassword: string }) => {
  await unwrap(api.POST('/api/v1/users/me/password', { body }));
};
