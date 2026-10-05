import Add from '@mui/icons-material/AddOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Address } from '@/api/schema';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorState } from '@/components/ErrorState';
import { useNotify } from '@/components/Notifications';
import { getErrorMessage } from '@/lib/errorMessage';
import { addressesQuery, useCreateAddress, useDeleteAddress, useUpdateAddress } from '../api';
import { formatAddress, toAddressForm } from '../formatAddress';
import { AccountSection } from './AccountSection';
import { AddressForm } from './AddressForm';

type Editing = { mode: 'create' } | { mode: 'edit'; address: Address } | null;

const nameOf = (address: Address) => address.label ?? address.recipientName;

export function AddressBook() {
  const { t } = useTranslation();
  const notify = useNotify();
  const addresses = useQuery(addressesQuery);
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const remove = useDeleteAddress();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const dialogTitleId = useId();

  const close = () => {
    setEditing(null);
  };

  return (
    <AccountSection
      title={t('profile.addressesTitle')}
      action={
        <Button
          startIcon={<Add />}
          onClick={() => {
            setEditing({ mode: 'create' });
          }}
        >
          {t('profile.addAddress')}
        </Button>
      }
    >
      {addresses.isPending ? (
        <Skeleton variant="rectangular" height={96} />
      ) : addresses.isError ? (
        <ErrorState
          headingLevel="h3"
          description={getErrorMessage(addresses.error, t)}
          onRetry={() => void addresses.refetch()}
        />
      ) : addresses.data.length === 0 ? (
        <Typography color="textSecondary">{t('profile.noAddresses')}</Typography>
      ) : (
        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          {addresses.data.map((address) => (
            <Box
              component="li"
              key={address.id}
              sx={{
                border: 1,
                borderColor: address.isDefault ? 'primary.main' : 'divider',
                borderRadius: 1,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography component="h3" sx={{ fontWeight: 650 }}>
                  {nameOf(address)}
                </Typography>
                {address.isDefault && (
                  <Chip size="small" color="primary" label={t('checkout.default')} />
                )}
              </Stack>
              <Typography variant="body2">{address.recipientName}</Typography>
              <Typography variant="body2" color="textSecondary">
                {formatAddress(address)}
              </Typography>
              {address.phone && (
                <Typography variant="body2" color="textSecondary">
                  {address.phone}
                </Typography>
              )}
              <Box sx={{ mt: 'auto', pt: 1, ml: -1 }}>
                {!address.isDefault && (
                  <Button
                    size="small"
                    aria-label={t('profile.setDefaultFor', { name: nameOf(address) })}
                    disabled={update.isPending}
                    onClick={() => {
                      update.mutate(
                        { id: address.id, body: { isDefault: true } },
                        {
                          onSuccess: () => {
                            notify({ message: t('profile.defaultSet') });
                          },
                          onError: (error) => {
                            notify({ message: getErrorMessage(error, t), severity: 'error' });
                          },
                        },
                      );
                    }}
                  >
                    {t('profile.setDefault')}
                  </Button>
                )}
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Button
                    size="small"
                    aria-label={t('profile.editAddress', { name: nameOf(address) })}
                    onClick={() => {
                      setEditing({ mode: 'edit', address });
                    }}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    aria-label={t('profile.deleteAddress', { name: nameOf(address) })}
                    onClick={() => {
                      setDeleting(address);
                    }}
                  >
                    {t('common.delete')}
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Dialog
        open={editing !== null}
        onClose={close}
        aria-labelledby={dialogTitleId}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id={dialogTitleId}>
          {editing?.mode === 'edit' ? t('address.editTitle') : t('address.newTitle')}
        </DialogTitle>
        <DialogContent>
          {editing && (
            <Box sx={{ pt: 1 }}>
              <AddressForm
                key={editing.mode === 'edit' ? editing.address.id : 'new'}
                defaultValues={
                  editing.mode === 'edit'
                    ? toAddressForm(editing.address)
                    : { isDefault: addresses.data?.length === 0 }
                }
                onCancel={close}
                onSubmit={async (body) => {
                  if (editing.mode === 'edit') {
                    await update.mutateAsync({ id: editing.address.id, body });
                  } else {
                    await create.mutateAsync(body);
                  }
                  notify({ message: t('address.saved') });
                  close();
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title={t('address.deleteConfirmTitle')}
        description={t('address.deleteConfirmBody')}
        confirmLabel={t('common.delete')}
        destructive
        pending={remove.isPending}
        onClose={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              notify({ message: t('address.deleted') });
              setDeleting(null);
            },
            onError: (error) => {
              notify({ message: getErrorMessage(error, t), severity: 'error' });
              setDeleting(null);
            },
          });
        }}
      />
    </AccountSection>
  );
}
