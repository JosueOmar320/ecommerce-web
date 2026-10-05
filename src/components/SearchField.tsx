import Search from '@mui/icons-material/SearchOutlined';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface SearchFieldProps {
  label: string;
  value: string | undefined;
  onSearch: (term: string | undefined) => void;
}

/**
 * Search-as-you-type for server-side lists. Debounced (300 ms) so typing does not flood the API;
 * callers write the term to the URL with `replace` so history does not grow per keystroke.
 */
export function SearchField({ label, value, onSearch }: SearchFieldProps) {
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
      placeholder={label}
      sx={{ width: { xs: '100%', sm: 320 } }}
      slotProps={{
        htmlInput: { 'aria-label': label },
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
