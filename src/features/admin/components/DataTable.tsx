import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '@/components/ErrorState';
import { visuallyHidden } from '@/lib/a11y';
import { getErrorMessage } from '@/lib/errorMessage';

export interface Column<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  /** Hidden on narrow screens; keep identifying columns visible. */
  hideBelow?: 'sm' | 'md' | 'lg';
}

interface DataTableProps<T> {
  /** Read by screen readers as the table's name. */
  caption: string;
  columns: Column<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  isPending: boolean;
  /** Background refetch (e.g. next page): the previous rows stay, dimmed. */
  isFetching?: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty: ReactNode;
}

const SKELETON_ROWS = 6;

/**
 * A real <table> (headers, caption) rather than a grid of divs: tabular data stays navigable
 * with screen-reader table commands. Wide tables scroll horizontally inside their card.
 */
export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowId,
  isPending,
  isFetching,
  error,
  onRetry,
  empty,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  if (error && !rows) {
    return (
      <Paper variant="outlined">
        <ErrorState headingLevel="h2" description={getErrorMessage(error, t)} onRetry={onRetry} />
      </Paper>
    );
  }

  const display = (column: Column<T>) =>
    column.hideBelow ? { xs: 'none', [column.hideBelow]: 'table-cell' } : undefined;

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Table
          size="small"
          aria-busy={isPending || isFetching ? true : undefined}
          sx={{
            opacity: isFetching && !isPending ? 0.6 : 1,
            transition: 'opacity 150ms',
            '& th': { fontWeight: 650, color: 'text.secondary', whiteSpace: 'nowrap' },
            '& td, & th': { px: 2, py: 1.25 },
          }}
        >
          <Box component="caption" sx={visuallyHidden}>
            {caption}
          </Box>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{ width: column.width, display: display(column) }}
                >
                  {column.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isPending ? (
              Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.id} sx={{ display: display(column) }}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !rows || rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ border: 0 }}>
                  {empty}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={getRowId(row)} hover>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align}
                      sx={{ display: display(column) }}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}
