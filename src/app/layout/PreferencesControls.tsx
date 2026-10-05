import DarkMode from '@mui/icons-material/DarkModeOutlined';
import LightMode from '@mui/icons-material/LightModeOutlined';
import SystemMode from '@mui/icons-material/SettingsBrightnessOutlined';
import Stack from '@mui/material/Stack';
import { useColorScheme } from '@mui/material/styles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { changeLanguage, isLanguage, LANGUAGES } from '@/i18n';

type Mode = 'light' | 'dark' | 'system';
const isMode = (value: unknown): value is Mode =>
  value === 'light' || value === 'dark' || value === 'system';

/**
 * Theme and language switches. Both apply instantly (no reload) and persist: MUI's colour-scheme
 * manager stores the theme (defaulting to the system preference), i18n stores the language.
 */
export function PreferencesControls() {
  const { t, i18n } = useTranslation();
  const { mode, setMode } = useColorScheme();

  return (
    <Stack spacing={2.5}>
      <div>
        <Typography id="pref-theme" variant="overline" component="p" color="textSecondary">
          {t('preferences.theme')}
        </Typography>
        <ToggleButtonGroup
          aria-labelledby="pref-theme"
          exclusive
          size="small"
          fullWidth
          value={mode ?? 'system'}
          onChange={(_, value: unknown) => {
            if (isMode(value)) setMode(value);
          }}
        >
          <ToggleButton value="light">
            <LightMode fontSize="small" sx={{ mr: 0.75 }} />
            {t('preferences.themeLight')}
          </ToggleButton>
          <ToggleButton value="dark">
            <DarkMode fontSize="small" sx={{ mr: 0.75 }} />
            {t('preferences.themeDark')}
          </ToggleButton>
          <ToggleButton value="system">
            <SystemMode fontSize="small" sx={{ mr: 0.75 }} />
            {t('preferences.themeSystem')}
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div>
        <Typography id="pref-language" variant="overline" component="p" color="textSecondary">
          {t('preferences.language')}
        </Typography>
        <ToggleButtonGroup
          aria-labelledby="pref-language"
          exclusive
          size="small"
          fullWidth
          value={i18n.resolvedLanguage}
          onChange={(_, value: unknown) => {
            if (isLanguage(value)) void changeLanguage(value);
          }}
        >
          {LANGUAGES.map((language) => (
            <ToggleButton key={language} value={language} lang={language}>
              {t(`preferences.languages.${language}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
    </Stack>
  );
}
