import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en } from './locales/en'
import { ja } from './locales/ja'
import { ko } from './locales/ko'
import { zh } from './locales/zh'
import type { Locale, Messages } from './types'

const STORAGE_KEY = 'hec-locale'

const locales: Record<Locale, Messages> = { zh, en, ko, ja }

const LOCALE_LANG: Record<Locale, string> = {
  zh: 'zh',
  en: 'en',
  ko: 'ko',
  ja: 'ja',
}

export const LOCALE_OPTIONS: { value: Locale; flag: string; label: string }[] = [
  { value: 'zh', flag: '🇨🇳', label: '中文' },
  { value: 'en', flag: '🇺🇸', label: 'English' },
  { value: 'ko', flag: '🇰🇷', label: '한국어' },
  { value: 'ja', flag: '🇯🇵', label: '日本語' },
]

const LOCALE_VALUES = new Set<string>(Object.keys(locales))

function getInitialLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && LOCALE_VALUES.has(saved)) return saved as Locale
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('zh')) return 'zh'
  if (lang.startsWith('ko')) return 'ko'
  if (lang.startsWith('ja')) return 'ja'
  return 'en'
}

function getNested(obj: unknown, path: string): string {
  const val = path.split('.').reduce<unknown>((o, k) => {
    if (o && typeof o === 'object' && k in o) return (o as Record<string, unknown>)[k]
    return undefined
  }, obj)
  return typeof val === 'string' ? val : path
}

interface I18nContextValue {
  locale: Locale
  messages: Messages
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.lang = LOCALE_LANG[next]
    document.title = locales[next].meta.title
  }, [])

  useEffect(() => {
    document.documentElement.lang = LOCALE_LANG[locale]
    document.title = locales[locale].meta.title
  }, [locale])

  const messages = locales[locale]

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let text = getNested(messages, key)
      if (params) {
        text = text.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`))
      }
      return text
    },
    [messages],
  )

  const value = useMemo(() => ({ locale, messages, setLocale, t }), [locale, messages, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
