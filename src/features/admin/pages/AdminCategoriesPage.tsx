import Add from '@mui/icons-material/AddOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CategoryNode } from '@/api/schema';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorState } from '@/components/ErrorState';
import { useNotify } from '@/components/Notifications';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { StatusPill } from '@/components/StatusPill';
import { useSession } from '@/features/auth/session';
import { getErrorMessage } from '@/lib/errorMessage';
import { adminCategoriesQuery, useDeleteCategory } from '../api/categories';
import { CategoryDialog, type CategoryDialogState } from '../components/CategoryDialog';

interface TreeActions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onAddChild: (node: CategoryNode) => void;
  onEdit: (node: CategoryNode) => void;
  onDelete: (node: CategoryNode) => void;
}

/**
 * Nested lists mirror the hierarchy, so screen readers announce the nesting level and item
 * count without a custom ARIA tree widget (and its keyboard model) being needed.
 */
function CategoryList({
  nodes,
  depth,
  actions,
}: {
  nodes: CategoryNode[];
  depth: number;
  actions: TreeActions;
}) {
  const { t } = useTranslation();
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {nodes.map((node) => (
        <Box component="li" key={node.id}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
              py: 1.25,
              pr: 2,
              pl: 2 + depth * 3,
              borderTop: 1,
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography sx={{ fontWeight: depth === 0 ? 650 : 500 }}>{node.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                /{node.slug} · {t('admin.categories.sortOrder')}: {node.sortOrder}
              </Typography>
            </Box>
            {!node.isActive && (
              <StatusPill tone="neutral">{t('admin.categories.hidden')}</StatusPill>
            )}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {actions.canCreate && (
                <Button
                  size="small"
                  aria-label={t('admin.categories.addChild', { name: node.name })}
                  onClick={() => {
                    actions.onAddChild(node);
                  }}
                >
                  <Add fontSize="small" aria-hidden />
                </Button>
              )}
              {actions.canUpdate && (
                <Button
                  size="small"
                  aria-label={t('admin.categories.edit', { name: node.name })}
                  onClick={() => {
                    actions.onEdit(node);
                  }}
                >
                  {t('common.edit')}
                </Button>
              )}
              {actions.canDelete && (
                <Button
                  size="small"
                  color="error"
                  aria-label={t('admin.categories.delete', { name: node.name })}
                  onClick={() => {
                    actions.onDelete(node);
                  }}
                >
                  {t('common.delete')}
                </Button>
              )}
            </Box>
          </Box>
          {node.children.length > 0 && (
            <CategoryList nodes={node.children} depth={depth + 1} actions={actions} />
          )}
        </Box>
      ))}
    </Box>
  );
}

export function AdminCategoriesPage() {
  const { t } = useTranslation();
  const notify = useNotify();
  const { hasPermission } = useSession();
  const tree = useQuery(adminCategoriesQuery);
  const remove = useDeleteCategory();
  const [dialog, setDialog] = useState<CategoryDialogState | null>(null);
  const [deleting, setDeleting] = useState<CategoryNode | null>(null);

  const actions: TreeActions = {
    canCreate: hasPermission('categories:create'),
    canUpdate: hasPermission('categories:update'),
    canDelete: hasPermission('categories:delete'),
    onAddChild: (node) => {
      setDialog({ mode: 'create', parentId: node.id });
    },
    onEdit: (node) => {
      setDialog({ mode: 'edit', category: node });
    },
    onDelete: setDeleting,
  };

  return (
    <>
      <Seo title={t('admin.categories.title')} index={false} />
      <PageHeader
        title={t('admin.categories.title')}
        description={t('admin.categories.subtitle')}
        actions={
          actions.canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setDialog({ mode: 'create', parentId: null });
              }}
            >
              {t('admin.categories.new')}
            </Button>
          )
        }
      />
      <Paper
        variant="outlined"
        component="section"
        aria-label={t('admin.categories.tree')}
        sx={{
          overflow: 'hidden',
          maxWidth: 960,
          '& > ul > li:first-of-type > div': { borderTop: 0 },
        }}
      >
        {tree.isPending ? (
          <Box sx={{ p: 2 }}>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} height={44} />
            ))}
          </Box>
        ) : tree.isError ? (
          <ErrorState
            headingLevel="h2"
            description={getErrorMessage(tree.error, t)}
            onRetry={() => void tree.refetch()}
          />
        ) : tree.data.length === 0 ? (
          <Typography color="textSecondary" sx={{ p: 4, textAlign: 'center' }}>
            {t('admin.categories.empty')}
          </Typography>
        ) : (
          <CategoryList nodes={tree.data} depth={0} actions={actions} />
        )}
      </Paper>

      {dialog && (
        <CategoryDialog
          key={dialog.mode === 'edit' ? dialog.category.id : `new-${dialog.parentId ?? 'root'}`}
          state={dialog}
          tree={tree.data ?? []}
          onClose={() => {
            setDialog(null);
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        title={t('admin.categories.deleteTitle', { name: deleting?.name ?? '' })}
        description={t('admin.categories.deleteBody')}
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
              notify({ message: t('admin.categories.deleted') });
              setDeleting(null);
            },
            onError: (error) => {
              notify({ message: getErrorMessage(error, t), severity: 'error' });
              setDeleting(null);
            },
          });
        }}
      />
    </>
  );
}
