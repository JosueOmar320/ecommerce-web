import Close from '@mui/icons-material/CloseOutlined';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { InventoryMovement } from '@/api/schema';
import { ErrorState } from '@/components/ErrorState';
import { useSession } from '@/features/auth/session';
import { getErrorMessage } from '@/lib/errorMessage';
import { formatDateTime } from '@/lib/format';
import { inventoryLevelQuery, movementsQuery } from '../api/inventory';
import { DataTable, type Column } from './DataTable';
import { RecordMovementForm } from './RecordMovementForm';

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

/** Stock level, manual movement form and the movement ledger of one variant. */
export function StockDrawer({ variantId, onClose }: { variantId: string; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useSession();
  const titleId = useId();
  const [page, setPage] = useState(1);
  const level = useQuery(inventoryLevelQuery(variantId));
  const movements = useQuery(movementsQuery(variantId, page));

  const columns: Column<InventoryMovement>[] = [
    {
      id: 'date',
      header: t('admin.inventory.date'),
      cell: (m) => (
        <>
          {formatDateTime(m.createdAt, i18n.language)}
          {m.reason && (
            <Typography variant="body2" color="textSecondary">
              {m.reason}
            </Typography>
          )}
        </>
      ),
    },
    {
      id: 'type',
      header: t('admin.inventory.movementType'),
      cell: (m) => t(`admin.inventory.types.${m.type}`),
    },
    {
      id: 'onHand',
      header: t('admin.inventory.onHandChange'),
      align: 'right',
      cell: (m) => signed(m.onHandDelta),
    },
    {
      id: 'reserved',
      header: t('admin.inventory.reservedChange'),
      align: 'right',
      cell: (m) => signed(m.reservedDelta),
    },
    {
      id: 'after',
      header: t('admin.inventory.after'),
      align: 'right',
      cell: (m) => `${m.onHandAfter} / ${m.reservedAfter}`,
    },
  ];

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-modal': true,
          'aria-labelledby': titleId,
          sx: { width: { xs: '100%', sm: 560 }, p: { xs: 2, sm: 3 } },
        },
      }}
    >
      <Box
        sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}
      >
        <Box>
          <Typography id={titleId} variant="h5" component="h2">
            {level.data
              ? t('admin.inventory.historyFor', { sku: level.data.sku })
              : t('common.loading')}
          </Typography>
          {level.data && (
            <Typography color="textSecondary">
              {level.data.productName} · {level.data.variantName}
            </Typography>
          )}
        </Box>
        <IconButton aria-label={t('common.close')} onClick={onClose} edge="end">
          <Close />
        </IconButton>
      </Box>

      {level.isError ? (
        <ErrorState headingLevel="h3" description={getErrorMessage(level.error, t)} />
      ) : (
        <>
          <Box
            component="dl"
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1.5,
              my: 3,
              '& > div': { border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 },
              '& dd': { m: 0, fontSize: '1.5rem', fontWeight: 700 },
            }}
          >
            {(['onHand', 'reserved', 'available'] as const).map((key) => (
              <div key={key}>
                <Typography component="dt" variant="body2" color="textSecondary">
                  {t(`admin.inventory.${key}`)}
                </Typography>
                <dd>{level.data ? level.data[key] : <Skeleton width={40} />}</dd>
              </div>
            ))}
          </Box>

          {hasPermission('inventory:adjust') && level.data && (
            <Box component="section" sx={{ mb: 3 }}>
              <Typography variant="h6" component="h3" sx={{ mb: 1.5 }}>
                {t('admin.inventory.recordMovement')}
              </Typography>
              <RecordMovementForm variantId={variantId} sku={level.data.sku} />
            </Box>
          )}

          <Typography variant="h6" component="h3" sx={{ mb: 1.5 }}>
            {t('admin.inventory.ledger')}
          </Typography>
          <DataTable
            caption={t('admin.inventory.ledger')}
            columns={columns}
            rows={movements.data?.data}
            getRowId={(m) => String(m.id)}
            isPending={movements.isPending}
            isFetching={movements.isPlaceholderData}
            error={movements.error}
            onRetry={() => void movements.refetch()}
            empty={
              <Typography color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                {t('admin.inventory.noMovements')}
              </Typography>
            }
          />
          {movements.data && movements.data.meta.totalPages > 1 && (
            <Box
              component="nav"
              aria-label={t('common.pagination')}
              sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}
            >
              <Pagination
                page={page}
                count={movements.data.meta.totalPages}
                onChange={(_event, value) => {
                  setPage(value);
                }}
                shape="rounded"
                size="small"
                getItemAriaLabel={(type, target, selected) =>
                  type === 'page'
                    ? selected
                      ? t('common.page', { page: target ?? 1 })
                      : t('common.goToPage', { page: target ?? 1 })
                    : type === 'previous'
                      ? t('common.previousPage')
                      : t('common.nextPage')
                }
              />
            </Box>
          )}
        </>
      )}
    </Drawer>
  );
}
