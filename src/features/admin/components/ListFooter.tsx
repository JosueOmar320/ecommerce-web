import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import type { PaginationMeta } from '@/api/schema';
import { LinkPagination } from '@/components/LinkPagination';

/** "Showing 21–40 of 134" plus page links; the totals come straight from the API's meta. */
export function ListFooter({ meta }: { meta: PaginationMeta | undefined }) {
  const { t, i18n } = useTranslation();
  if (!meta || meta.total === 0) return null;
  const number = (value: number) => value.toLocaleString(i18n.language);
  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.page * meta.pageSize, meta.total);
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        mt: 2,
        '& nav': { mt: '0 !important' },
      }}
    >
      <Typography variant="body2" color="textSecondary" role="status">
        {t('admin.showing', { from: number(from), to: number(to), total: number(meta.total) })}
      </Typography>
      <LinkPagination page={meta.page} totalPages={meta.totalPages} />
    </Box>
  );
}
