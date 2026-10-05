import { styled } from '@mui/material/styles';
import { layout } from '@/theme/theme';

/** Centers content on the shared grid so every page aligns with the header and footer. */
export const PageContainer = styled('div')(({ theme }) => ({
  width: '100%',
  maxWidth: layout.maxWidth,
  marginInline: 'auto',
  paddingInline: theme.spacing(layout.gutter.xs),
  [theme.breakpoints.up('sm')]: { paddingInline: theme.spacing(layout.gutter.sm) },
  [theme.breakpoints.up('md')]: { paddingInline: theme.spacing(layout.gutter.md) },
}));
