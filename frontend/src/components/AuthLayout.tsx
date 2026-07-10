import { Link } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'
import { THEME_STYLE } from '../data/site'
import { useI18n } from '../i18n/I18nProvider'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  headerExtra?: React.ReactNode
}

export default function AuthLayout({ children, title, subtitle, headerExtra }: AuthLayoutProps) {
  const { t } = useI18n()

  return (
    <div
      className="min-h-screen bg-[#0d1117] text-gray-200 flex items-center justify-center px-4 relative overflow-hidden"
      style={THEME_STYLE}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-teal-500/6 rounded-full blur-[100px]" />
      </div>

      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-500 hover:text-emerald-400 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('auth.backHome')}
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-emerald-500/25">
              H
            </div>
            <span className="font-bold text-2xl text-white">HEC Mining</span>
          </Link>
          <h1 className="mt-8 text-3xl font-bold text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-gray-500">{subtitle}</p>}
          {headerExtra}
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-8 backdrop-blur-sm">{children}</div>
      </div>
    </div>
  )
}
