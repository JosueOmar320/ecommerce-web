import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProductVariant } from '@/api/schema';
import { optionState, type Selection } from '../variants';

interface VariantPickerProps {
  options: Record<string, string[]>;
  variants: ProductVariant[];
  selection: Selection;
  onSelect: (axis: string, value: string) => void;
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * One labelled group per attribute (color, storage, size…). Sold-out options stay selectable but
 * are struck through; combinations that do not exist are disabled. Both are spelled out for
 * screen readers, not only conveyed by styling.
 */
export function VariantPicker({ options, variants, selection, onSelect }: VariantPickerProps) {
  const { t } = useTranslation();
  const baseId = useId();

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      {Object.entries(options).map(([axis, values]) => {
        const labelId = `${baseId}-${axis}`;
        return (
          <div key={axis}>
            <Typography id={labelId} variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {capitalize(axis)}:{' '}
              <Box component="span" sx={{ fontWeight: 400 }}>
                {selection[axis]}
              </Box>
            </Typography>
            <ToggleButtonGroup
              exclusive
              aria-labelledby={labelId}
              value={selection[axis] ?? null}
              onChange={(_, value: string | null) => {
                if (value) onSelect(axis, value);
              }}
              sx={{
                flexWrap: 'wrap',
                gap: 1,
                '& .MuiToggleButtonGroup-grouped': {
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: '2px !important',
                  m: 0,
                },
              }}
            >
              {values.map((value) => {
                const state = optionState(variants, selection, axis, value);
                const label =
                  state === 'out_of_stock'
                    ? t('product.optionOutOfStock', { value })
                    : state === 'unavailable'
                      ? t('product.optionUnavailable', { value })
                      : value;
                return (
                  <ToggleButton
                    key={value}
                    value={value}
                    disabled={state === 'unavailable'}
                    aria-label={label}
                    sx={{
                      px: 2,
                      minWidth: 64,
                      textTransform: 'none',
                      fontWeight: 550,
                      ...(state === 'out_of_stock' && {
                        textDecoration: 'line-through',
                        color: 'text.secondary',
                      }),
                      '&.Mui-selected': { borderColor: 'text.primary', bgcolor: 'action.selected' },
                    }}
                  >
                    {value}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          </div>
        );
      })}
    </Box>
  );
}
