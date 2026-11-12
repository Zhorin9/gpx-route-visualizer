import i18n, { type ParseKeys } from 'i18next'
import { initReactI18next } from 'react-i18next'
import pl from './pl'
import en from './en'

export const LANGUAGES = ['pl', 'en'] as const
export type Language = (typeof LANGUAGES)[number]
export type TKey = ParseKeys

const STORAGE_KEY = 'gpxVisualizer.language'
const LOCALES: Record<Language, string> = { pl: 'pl-PL', en: 'en-GB' }

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof pl }
  }
}

function savedLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return LANGUAGES.find((l) => l === saved) ?? 'pl'
  } catch {
    return 'pl'
  }
}

i18n.on('languageChanged', (lng) => {
  globalThis.document?.documentElement.setAttribute('lang', lng)
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    // Without storage the choice lasts until the page reloads.
  }
})

void i18n.use(initReactI18next).init({
  resources: { pl: { translation: pl }, en: { translation: en } },
  lng: savedLanguage(),
  fallbackLng: 'pl',
  interpolation: { escapeValue: false },
})

export function currentLocale(): string {
  return LOCALES[i18n.language as Language] ?? LOCALES.pl
}

export default i18n
