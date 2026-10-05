import Box from '@mui/material/Box';

interface ProductMediaProps {
  /** Stable seed (product id) so a product always gets the same tint. */
  seed: string;
  brand: string | null;
  name: string;
  /** `hero` on the product page; `thumb` for small list rows (initial only). */
  size?: 'thumb' | 'card' | 'hero';
}

function hue(seed: string): number {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

/**
 * The API has no product images yet. Instead of stock photos that would misrepresent products,
 * this renders a quiet typographic panel with fixed proportions (no layout shift). When the API
 * adds images, this is the only component that needs to change (an <img> with width/height and
 * loading="lazy").
 */
export function ProductMedia({ seed, brand, name, size = 'card' }: ProductMediaProps) {
  const h = hue(seed);
  if (size === 'thumb') {
    return (
      <Box
        aria-hidden
        sx={(theme) => ({
          aspectRatio: '4 / 5',
          display: 'grid',
          placeItems: 'center',
          borderRadius: 1,
          fontWeight: 700,
          fontSize: '1.25rem',
          bgcolor: `hsl(${h} 18% 92%)`,
          color: `hsl(${h} 25% 24%)`,
          ...theme.applyStyles('dark', {
            bgcolor: `hsl(${h} 12% 16%)`,
            color: `hsl(${h} 18% 78%)`,
          }),
        })}
      >
        {name.charAt(0)}
      </Box>
    );
  }
  return (
    <Box
      aria-hidden
      sx={(theme) => ({
        position: 'relative',
        aspectRatio: '4 / 5',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
        p: size === 'hero' ? { xs: 3, md: 5 } : 2,
        bgcolor: `hsl(${h} 18% 92%)`,
        color: `hsl(${h} 25% 24%)`,
        ...theme.applyStyles('dark', { bgcolor: `hsl(${h} 12% 16%)`, color: `hsl(${h} 18% 78%)` }),
      })}
    >
      <Box
        sx={{
          position: 'absolute',
          top: size === 'hero' ? 32 : 16,
          left: size === 'hero' ? 32 : 16,
          fontSize: size === 'hero' ? '0.8rem' : '0.7rem',
          fontWeight: 650,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        {brand ?? ''}
      </Box>
      <Box
        sx={{
          fontWeight: 700,
          letterSpacing: '-0.04em',
          lineHeight: 0.95,
          fontSize: size === 'hero' ? 'clamp(2.5rem, 5vw, 4.5rem)' : 'clamp(1.4rem, 2.2vw, 1.9rem)',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {name}
      </Box>
    </Box>
  );
}
