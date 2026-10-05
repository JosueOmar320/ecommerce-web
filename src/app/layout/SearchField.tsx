import Search from '@mui/icons-material/SearchOutlined';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

interface SearchFieldProps {
  inputRef?: Ref<HTMLInputElement>;
  onSubmitted?: () => void;
}

/** Global search: submits to the server-side search on /products (the URL is the state). */
export function SearchField({ inputRef, onSubmitted }: SearchFieldProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const fromUrl = pathname === '/products' ? (params.get('search') ?? '') : '';

  const [value, setValue] = useState(fromUrl);
  // Follow the URL (back/forward, filter resets) without an effect: adjust state during render.
  const [syncedWith, setSyncedWith] = useState(fromUrl);
  if (syncedWith !== fromUrl) {
    setSyncedWith(fromUrl);
    setValue(fromUrl);
  }

  return (
    <form
      role="search"
      style={{ width: '100%' }}
      onSubmit={(event) => {
        event.preventDefault();
        const term = value.trim();
        void navigate(term ? `/products?search=${encodeURIComponent(term)}` : '/products');
        onSubmitted?.();
      }}
    >
      <TextField
        size="small"
        type="search"
        value={value}
        inputRef={inputRef}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        placeholder={t('search.placeholder')}
        slotProps={{
          htmlInput: { 'aria-label': t('search.label'), enterKeyHint: 'search' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
    </form>
  );
}
