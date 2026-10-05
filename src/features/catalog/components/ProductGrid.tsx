import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import type { ReactNode } from 'react';

export const productGridSx = {
  display: 'grid',
  gap: { xs: '24px 12px', sm: '32px 20px', md: '40px 24px' },
  gridTemplateColumns: {
    xs: 'repeat(2, minmax(0, 1fr))',
    md: 'repeat(3, minmax(0, 1fr))',
    lg: 'repeat(4, minmax(0, 1fr))',
  },
  listStyle: 'none',
  p: 0,
  m: 0,
} as const;

/**
 * A real list (<ul>) so screen readers announce "list, 24 items". Children are
 * <ProductGridItem key={product.id}> elements.
 */
export function ProductGrid({ children }: { children: ReactNode }) {
  return (
    <Box component="ul" sx={productGridSx}>
      {children}
    </Box>
  );
}

export const ProductGridItem = 'li';

/** Same geometry as the real grid, so content does not jump when it arrives. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Box sx={productGridSx} aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <Skeleton variant="rectangular" sx={{ aspectRatio: '4 / 5', height: 'auto' }} />
          <Skeleton width="40%" sx={{ mt: 1.5 }} />
          <Skeleton width="80%" />
          <Skeleton width="30%" />
        </div>
      ))}
    </Box>
  );
}
