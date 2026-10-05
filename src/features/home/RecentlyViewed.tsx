import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useQueries } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { ProductDetail } from '@/api/schema';
import { productQuery } from '@/features/catalog/api';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { ProductGrid, ProductGridItem } from '@/features/catalog/components/ProductGrid';
import { useRecentlyViewed } from '@/features/catalog/hooks/useRecentlyViewed';

/**
 * Products this browser opened recently, with live data (shared with the product page cache).
 * Products that no longer exist are skipped silently. Hidden entirely until there is something.
 */
export function RecentlyViewed() {
  const { t } = useTranslation();
  const { slugs } = useRecentlyViewed();
  const results = useQueries({
    queries: slugs.slice(0, 4).map((slug) => ({ ...productQuery(slug), retry: false })),
  });
  const products = results.map((r) => r.data).filter((p): p is ProductDetail => p !== undefined);

  if (products.length === 0) return null;
  return (
    <Box component="section" sx={{ mt: { xs: 8, md: 12 } }}>
      <Typography variant="h3" component="h2" sx={{ mb: 3 }}>
        {t('home.recentlyViewedTitle')}
      </Typography>
      <ProductGrid>
        {products.map((product) => (
          <ProductGridItem key={product.id}>
            <ProductCard product={product} />
          </ProductGridItem>
        ))}
      </ProductGrid>
    </Box>
  );
}
