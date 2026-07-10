import { useEffect, useRef, useState } from 'react'
import { LOCALE_OPTIONS, useI18n } from '../i18n/I18nProvider'

interface LanguageSwitcherProps {
  className?: string
  onSelect?: () => void
  variant?: 'default' | 'dashboard'
}

export default function LanguageSwitcher({ className = '', onSelect, variant = 'default' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = LOCALE_OPTIONS.find((o) => o.value === locale) ?? LOCALE_OPTIONS[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isDashboard = variant === 'dashboard'

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-white/[0.06] text-gray-400 hover:bg-white/[0.1] hover:text-white"
      >
        <span>{current.flag}</span>
        <span className={isDashboard ? undefined : 'hidden sm:inline'}>{current.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-40 rounded-xl shadow-lg border z-50 overflow-hidden ${
            isDashboard ? 'bg-[#161b22] border-gray-700/50' : 'bg-[#1e2830] border-white/[0.08]'
          }`}
        >
          {LOCALE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setLocale(opt.value)
                setOpen(false)
                onSelect?.()
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                locale === opt.value
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <span className="text-lg">{opt.flag}</span>
              <span className="font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
