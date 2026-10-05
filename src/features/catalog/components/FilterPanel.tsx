import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { categoriesQuery } from '../api';
import type { ProductFilters } from '../filters';
import { PriceRangeFilter } from './PriceRangeFilter';

interface FilterPanelProps {
  filters: ProductFilters;
  onChange: (changes: Partial<ProductFilters>) => void;
  /** Hidden on category pages, where the category is part of the path. */
  showCategories?: boolean;
  currencySymbol: string;
}

function Section({
  title,
  children,
  labelId,
}: {
  title: string;
  children: ReactNode;
  labelId: string;
}) {
  return (
    <Box component="section" aria-labelledby={labelId} sx={{ py: 2.5 }}>
      <Typography
        id={labelId}
        variant="overline"
        component="h2"
        color="text.secondary"
        sx={{ display: 'block', mb: 1 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

/** Filter controls. Each change is written to the URL by the caller (see useProductFilters). */
export function FilterPanel({
  filters,
  onChange,
  showCategories = true,
  currencySymbol,
}: FilterPanelProps) {
  const { t } = useTranslation();
  const categories = useQuery({ ...categoriesQuery, enabled: showCategories });
  const ids = { category: useId(), price: useId(), availability: useId() };

  return (
    <div>
      {showCategories && (
        <>
          <Section title={t('catalog.category')} labelId={ids.category}>
            {categories.isPending ? (
              <Box aria-hidden>
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} width={`${60 + ((i * 13) % 30)}%`} height={32} />
                ))}
              </Box>
            ) : (
              <RadioGroup
                aria-labelledby={ids.category}
                value={filters.category ?? ''}
                onChange={(_, value) => {
                  onChange({ category: value || undefined });
                }}
              >
                <FormControlLabel
                  value=""
                  control={<Radio size="small" />}
                  label={t('catalog.allCategories')}
                />
                {(categories.data ?? []).map((parent) => (
                  <Fragment key={parent.id}>
                    <FormControlLabel
                      value={parent.slug}
                      control={<Radio size="small" />}
                      label={parent.name}
                    />
                    {parent.children.map((child) => (
                      <FormControlLabel
                        key={child.id}
                        value={child.slug}
                        control={<Radio size="small" />}
                        label={child.name}
                        sx={{ pl: 3 }}
                      />
                    ))}
                  </Fragment>
                ))}
              </RadioGroup>
            )}
          </Section>
          <Divider />
        </>
      )}
      <Section title={t('catalog.price')} labelId={ids.price}>
        <PriceRangeFilter
          min={filters.minPrice}
          max={filters.maxPrice}
          currencySymbol={currencySymbol}
          onChange={onChange}
        />
      </Section>
      <Divider />
      <Section title={t('catalog.availability')} labelId={ids.availability}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={filters.availability === 'in_stock'}
              onChange={(event) => {
                onChange({ availability: event.target.checked ? 'in_stock' : undefined });
              }}
            />
          }
          label={t('catalog.inStockOnly')}
        />
      </Section>
    </div>
  );
}
