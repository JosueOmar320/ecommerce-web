import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import type { ProductSummary } from '@/api/schema';
import { formatMoney } from '@/lib/format';
import { productQuery } from '../api';
import { ProductMedia } from './ProductMedia';

interface ProductCardProps {
  product: ProductSummary;
  /** Heading level of the product name within the page outline. */
  headingLevel?: 'h2' | 'h3';
  /** Extra controls rendered above the link (e.g. a wishlist toggle). */
  action?: ReactNode;
}

/**
 * One accessible link per card (the title), stretched over the whole card with ::after, so
 * screen readers hear one clear link instead of several duplicates.
 */
export function ProductCard({ product, headingLevel = 'h3', action }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  // Warm the product page on hover/focus; a failed prefetch is irrelevant (the page will retry).
  const prefetch = () => {
    queryClient.query(productQuery(product.slug)).catch(() => undefined);
  };

  const price =
    product.minPriceCents === null
      ? null
      : product.maxPriceCents !== null && product.maxPriceCents > product.minPriceCents
        ? t('catalog.from', {
            price: formatMoney(product.minPriceCents, product.currency, i18n.language),
          })
        : formatMoney(product.minPriceCents, product.currency, i18n.language);

  return (
    <Box
      component="article"
      sx={{
        position: 'relative',
        '&:hover .product-title, &:focus-within .product-title': { textDecoration: 'underline' },
        '&:focus-within': {
          outline: '2px solid var(--mui-palette-primary-main)',
          outlineOffset: 4,
        },
      }}
    >
      <ProductMedia seed={product.id} brand={product.brand} name={product.name} />
      {action && <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>{action}</Box>}
      <Box sx={{ pt: 1.5 }}>
        {product.brand && (
          <Typography
            variant="overline"
            component="p"
            color="text.secondary"
            sx={{ lineHeight: 1.4 }}
          >
            {product.brand}
          </Typography>
        )}
        <Typography
          variant="h6"
          component={headingLevel}
          sx={{ fontWeight: 600, lineHeight: 1.35 }}
        >
          <Box
            component={RouterLink}
            to={`/products/${product.slug}`}
            className="product-title"
            onMouseEnter={prefetch}
            onFocus={prefetch}
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              textUnderlineOffset: 3,
              '&:focus-visible': { outline: 'none' },
              '&::after': { content: '""', position: 'absolute', inset: 0, zIndex: 1 },
            }}
          >
            {product.name}
          </Box>
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 1,
            mt: 0.5,
          }}
        >
          {price && <Typography sx={{ fontWeight: 600 }}>{price}</Typography>}
          {!product.inStock && (
            <Typography variant="body2" color="text.secondary">
              {t('catalog.outOfStock')}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
