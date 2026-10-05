import Tune from '@mui/icons-material/TuneOutlined';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PreferencesControls } from './PreferencesControls';

export function PreferencesMenu() {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();
  const label = `${t('preferences.theme')} · ${t('preferences.language')}`;

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          aria-label={label}
          aria-haspopup="dialog"
          aria-expanded={anchor ? true : undefined}
          aria-controls={anchor ? id : undefined}
          onClick={(event) => {
            setAnchor(event.currentTarget);
          }}
        >
          <Tune />
        </IconButton>
      </Tooltip>
      <Popover
        id={id}
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => {
          setAnchor(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { p: 2.5, width: 320, border: 1, borderColor: 'divider' },
            role: 'dialog',
            'aria-label': label,
          },
        }}
      >
        <PreferencesControls />
      </Popover>
    </>
  );
}
