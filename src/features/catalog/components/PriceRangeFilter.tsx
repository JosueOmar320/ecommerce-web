import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

const VALID = /^\d{0,9}(\.\d{0,2})?$/;

interface PriceRangeFilterProps {
  min: string | undefined;
  max: string | undefined;
  currencySymbol: string;
  onChange: (range: { minPrice?: string; maxPrice?: string }) => void;
}

/**
 * Two numeric inputs instead of a slider: the API exposes no price bounds to scale a slider
 * against, and typed amounts are easier for keyboard and screen-reader users. Applied on blur or
 * Enter, not on every keystroke.
 */
export function PriceRangeFilter({ min, max, currencySymbol, onChange }: PriceRangeFilterProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState({ min: min ?? '', max: max ?? '' });
  const [synced, setSynced] = useState({ min, max });
  if (synced.min !== min || synced.max !== max) {
    setSynced({ min, max });
    setDraft({ min: min ?? '', max: max ?? '' });
  }

  const apply = () => {
    const clean = (value: string) => (value && !value.endsWith('.') ? value : undefined);
    if (clean(draft.min) === min && clean(draft.max) === max) return;
    onChange({ minPrice: clean(draft.min), maxPrice: clean(draft.max) });
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') apply();
  };
  const adornment = {
    startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
  };

  return (
    <Stack direction="row" spacing={1.5}>
      {(['min', 'max'] as const).map((key) => (
        <TextField
          key={key}
          size="small"
          label={key === 'min' ? t('catalog.minPrice') : t('catalog.maxPrice')}
          value={draft[key]}
          onChange={(event) => {
            if (VALID.test(event.target.value))
              setDraft((d) => ({ ...d, [key]: event.target.value }));
          }}
          onBlur={apply}
          onKeyDown={onKeyDown}
          slotProps={{ input: adornment, htmlInput: { inputMode: 'decimal' } }}
        />
      ))}
    </Stack>
  );
}
