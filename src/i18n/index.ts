import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { readStorage, writeStorage } from '@/lib/storage';
import { en, type Translations } from './locales/en';

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

/**
 * English is bundled (default and fallback); other languages are separate chunks fetched the first
 * time they are needed, so visitors only download the copy they read.
 */
const loaders: Record<Exclude<Language, 'en'>, () => Promise<Translations>> = {
  es: () => import('./locales/es').then((module) => module.es),
};

async function ensureResources(language: Language) {
  if (language === 'en' || i18n.hasResourceBundle(language, 'translation')) return;
  i18n.addResourceBundle(language, 'translation', await loaders[language]());
}

export async function changeLanguage(language: Language): Promise<unknown> {
  writeStorage(STORAGE_KEY, language);
  await ensureResources(language);
  return i18n.changeLanguage(language);
}

// Keep <html lang> in sync so screen readers pronounce content correctly (WCAG 3.1.1).
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: LANGUAGES,
  interpolation: { escapeValue: false }, // React already escapes output.
  returnNull: false,
});

/**
 * Resolves once the visitor's language is loaded and active. The app renders after it, so a
 * Spanish visitor never sees English first. Offline or failing chunk: continue in English.
 */
export const i18nReady: Promise<unknown> = (async () => {
  const language = detectLanguage();
  if (language === 'en') return;
  try {
    await ensureResources(language);
    await i18n.changeLanguage(language);
  } catch {
    // Keep English.
  }
})();

export { i18n };
