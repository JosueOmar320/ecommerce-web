import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';
import type { ProductFilters } from '../filters';

interface ActiveFiltersProps {
  filters: ProductFilters;
  categoryName?: string;
  formatPrice: (major: string) => string;
  onRemove: (changes: Partial<ProductFilters>) => void;
  onClear: () => void;
}

/** Removable chips summarising what is applied, so users always know why results look the way they do. */
export function ActiveFilters({
  filters,
  categoryName,
  formatPrice,
  onRemove,
  onClear,
}: ActiveFiltersProps) {
  const { t } = useTranslation();
  const chips: { key: string; label: string; changes: Partial<ProductFilters> }[] = [];

  if (filters.category)
    chips.push({
      key: 'category',
      label: categoryName ?? filters.category,
      changes: { category: undefined },
    });
  if (filters.brand)
    chips.push({
      key: 'brand',
      label: `${t('catalog.brand')}: ${filters.brand}`,
      changes: { brand: undefined },
    });
  if (filters.minPrice || filters.maxPrice) {
    const label =
      filters.minPrice && filters.maxPrice
        ? t('catalog.priceRangeLabel', {
            min: formatPrice(filters.minPrice),
            max: formatPrice(filters.maxPrice),
          })
        : filters.minPrice
          ? t('catalog.priceFrom', { value: formatPrice(filters.minPrice) })
          : t('catalog.priceUpTo', { value: formatPrice(filters.maxPrice ?? '0') });
    chips.push({ key: 'price', label, changes: { minPrice: undefined, maxPrice: undefined } });
  }
  if (filters.availability) {
    chips.push({
      key: 'availability',
      label:
        filters.availability === 'in_stock'
          ? t('catalog.inStockOnly')
          : t('catalog.outOfStockOnly'),
      changes: { availability: undefined },
    });
  }
  if (chips.length === 0) return null;

  return (
    <Stack
      direction="row"
      useFlexGap
      spacing={1}
      sx={{ flexWrap: 'wrap', alignItems: 'center', mb: 3 }}
      aria-label={t('catalog.activeFilters')}
      role="group"
    >
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          label={chip.label}
          variant="outlined"
          // The whole chip is the control: click, Enter or Delete removes the filter.
          aria-label={t('catalog.removeFilter', { label: chip.label })}
          onClick={() => {
            onRemove(chip.changes);
          }}
          onDelete={() => {
            onRemove(chip.changes);
          }}
        />
      ))}
      {chips.length > 1 && (
        <Button size="small" onClick={onClear}>
          {t('catalog.clearFilters')}
        </Button>
      )}
    </Stack>
  );
}
