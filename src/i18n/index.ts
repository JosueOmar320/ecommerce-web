import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { readStorage, writeStorage } from '@/lib/storage';
import { en } from './locales/en';
import { es } from './locales/es';

export const LANGUAGES = ['en', 'es'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'kestrel.language';

export const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);

/** Saved preference first, then the browser's language, then English. */
export function detectLanguage(): Language {
  const saved = readStorage(STORAGE_KEY);
  if (isLanguage(saved)) return saved;
  const browser = navigator.language.slice(0, 2);
  return isLanguage(browser) ? browser : 'en';
}

export function changeLanguage(language: Language): Promise<unknown> {
  writeStorage(STORAGE_KEY, language);
  return i18n.changeLanguage(language);
}

// Keep <html lang> in sync so screen readers pronounce content correctly (WCAG 3.1.1).
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: detectLanguage(),
  fallbackLng: 'en',
  supportedLngs: LANGUAGES,
  interpolation: { escapeValue: false }, // React already escapes output.
  returnNull: false,
});

export { i18n };
