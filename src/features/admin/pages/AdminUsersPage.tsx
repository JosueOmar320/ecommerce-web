import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import type { User } from '@/api/schema';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useNotify } from '@/components/Notifications';
import { PageHeader } from '@/components/PageHeader';
import { SearchField } from '@/components/SearchField';
import { Seo } from '@/components/Seo';
import { StatusPill } from '@/components/StatusPill';
import { useSession } from '@/features/auth/session';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { getErrorMessage } from '@/lib/errorMessage';
import { formatDate } from '@/lib/format';
import { ROLES, useUpdateUser, userFiltersSchema, usersQuery } from '../api/users';
import { DataTable, type Column } from '../components/DataTable';
import { FilterBar, FilterSelect } from '../components/FilterBar';
import { ListFooter } from '../components/ListFooter';
import { RolesDialog } from '../components/RolesDialog';

const fullName = (user: User) => `${user.firstName} ${user.lastName}`;

export function AdminUsersPage() {
  const { t, i18n } = useTranslation();
  const notify = useNotify();
  const { user: me, hasPermission } = useSession();
  const { filters, update } = useUrlFilters(userFiltersSchema);
  const users = useQuery(usersQuery(filters));
  const updateUser = useUpdateUser();
  const [editingRoles, setEditingRoles] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState<User | null>(null);
  const canUpdate = hasPermission('users:update');
  const canSeeOrders = hasPermission('orders:read');

  const setActive = (user: User, isActive: boolean) => {
    updateUser.mutate(
      { id: user.id, body: { isActive } },
      {
        onSuccess: () => {
          notify({
            message: t(isActive ? 'admin.users.activated' : 'admin.users.deactivated', {
              name: fullName(user),
            }),
          });
          setDeactivating(null);
        },
        onError: (error) => {
          notify({ message: getErrorMessage(error, t), severity: 'error' });
          setDeactivating(null);
        },
      },
    );
  };

  const columns: Column<User>[] = [
    {
      id: 'name',
      header: t('admin.users.name'),
      cell: (user) => (
        <>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {fullName(user)}
            {user.id === me?.id && (
              <Typography component="span" variant="body2" color="textSecondary">
                {' '}
                ({t('admin.users.you')})
              </Typography>
            )}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ display: { md: 'none' }, overflowWrap: 'anywhere' }}
          >
            {user.email}
          </Typography>
          <Box sx={{ display: { sm: 'none' }, mt: 0.5 }}>
            <StatusPill tone={user.isActive ? 'success' : 'neutral'}>
              {user.isActive ? t('admin.active') : t('admin.inactive')}
            </StatusPill>
          </Box>
        </>
      ),
    },
    { id: 'email', header: t('admin.users.email'), hideBelow: 'md', cell: (user) => user.email },
    {
      id: 'roles',
      header: t('admin.users.role'),
      hideBelow: 'sm',
      cell: (user) => user.roles.map((role) => t(`admin.users.roles.${role}`)).join(', '),
    },
    {
      id: 'status',
      header: t('admin.users.status'),
      hideBelow: 'sm',
      cell: (user) => (
        <StatusPill tone={user.isActive ? 'success' : 'neutral'}>
          {user.isActive ? t('admin.active') : t('admin.inactive')}
        </StatusPill>
      ),
    },
    {
      id: 'joined',
      header: t('admin.users.joined'),
      hideBelow: 'lg',
      cell: (user) => formatDate(user.createdAt, i18n.language),
    },
    {
      id: 'actions',
      header: <span>{t('admin.actions')}</span>,
      align: 'right',
      cell: (user) => {
        const name = fullName(user);
        const isSelf = user.id === me?.id;
        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, flexWrap: 'wrap' }}>
            {canSeeOrders && (
              <Button
                size="small"
                component={RouterLink}
                to={`/admin/orders?userId=${user.id}`}
                aria-label={t('admin.users.orders', { name })}
              >
                {t('nav.orders')}
              </Button>
            )}
            {canUpdate && (
              <Button
                size="small"
                aria-label={t('admin.users.editRoles', { name })}
                onClick={() => {
                  setEditingRoles(user);
                }}
              >
                {t('admin.users.role')}
              </Button>
            )}
            {/* The API refuses deactivating yourself; the action is not offered. */}
            {canUpdate && !isSelf && (
              <Button
                size="small"
                color={user.isActive ? 'error' : 'primary'}
                disabled={updateUser.isPending}
                aria-label={t(user.isActive ? 'admin.users.deactivate' : 'admin.users.activate', {
                  name,
                })}
                onClick={() => {
                  if (user.isActive) setDeactivating(user);
                  else setActive(user, true);
                }}
              >
                {user.isActive
                  ? t('admin.users.deactivateAction')
                  : t('admin.users.activateAction')}
              </Button>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <>
      <Seo title={t('admin.users.title')} index={false} />
      <PageHeader title={t('admin.users.title')} description={t('admin.users.subtitle')} />
      <FilterBar>
        <SearchField
          label={t('admin.users.search')}
          value={filters.search}
          onSearch={(search) => {
            update({ search }, { replace: true });
          }}
        />
        <FilterSelect
          label={t('admin.users.role')}
          value={filters.role ?? ''}
          onChange={(event) => {
            update({ role: ROLES.find((role) => role === event.target.value) });
          }}
        >
          <MenuItem value="">{t('admin.users.allRoles')}</MenuItem>
          {ROLES.map((role) => (
            <MenuItem key={role} value={role}>
              {t(`admin.users.roles.${role}`)}
            </MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect
          label={t('admin.users.status')}
          value={filters.isActive ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            update({ isActive: value === 'true' || value === 'false' ? value : undefined });
          }}
        >
          <MenuItem value="">{t('admin.all')}</MenuItem>
          <MenuItem value="true">{t('admin.active')}</MenuItem>
          <MenuItem value="false">{t('admin.inactive')}</MenuItem>
        </FilterSelect>
      </FilterBar>
      <DataTable
        caption={t('admin.users.caption')}
        columns={columns}
        rows={users.data?.data}
        getRowId={(user) => user.id}
        isPending={users.isPending}
        isFetching={users.isPlaceholderData}
        error={users.error}
        onRetry={() => void users.refetch()}
        empty={
          <Typography color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
            {t('admin.users.empty')}
          </Typography>
        }
      />
      <ListFooter meta={users.data?.meta} />

      {editingRoles && (
        <RolesDialog
          key={editingRoles.id}
          user={editingRoles}
          isSelf={editingRoles.id === me?.id}
          onClose={() => {
            setEditingRoles(null);
          }}
        />
      )}
      <ConfirmDialog
        open={deactivating !== null}
        title={t('admin.users.deactivateTitle', {
          name: deactivating ? fullName(deactivating) : '',
        })}
        description={t('admin.users.deactivateBody')}
        confirmLabel={t('admin.users.deactivate', {
          name: deactivating ? fullName(deactivating) : '',
        })}
        destructive
        pending={updateUser.isPending}
        onClose={() => {
          setDeactivating(null);
        }}
        onConfirm={() => {
          if (deactivating) setActive(deactivating, false);
        }}
      />
    </>
  );
}
