import Search from '@mui/icons-material/SearchOutlined';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface CatalogSearchFieldProps {
  value: string | undefined;
  onSearch: (term: string | undefined) => void;
}

/**
 * Search-as-you-type within the listing. Debounced (300 ms) and written to the URL with
 * `replace`, so typing neither floods the API nor fills the history with one entry per letter.
 * The search itself runs on the server (full-text); nothing is filtered client-side.
 */
export function CatalogSearchField({ value, onSearch }: CatalogSearchFieldProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value ?? '');
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setDraft(value ?? '');
  }

  const debounced = useDebouncedValue(draft.trim(), 300);
  useEffect(() => {
    if ((debounced || undefined) !== value) onSearch(debounced || undefined);
    // Only react to the user's typing; `value` changes are handled by the sync above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <TextField
      size="small"
      type="search"
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
      }}
      placeholder={t('catalog.searchWithin')}
      sx={{ maxWidth: { sm: 320 } }}
      slotProps={{
        htmlInput: { 'aria-label': t('catalog.searchWithin') },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
