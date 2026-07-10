import { Link, useNavigate } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'
import { useAuth } from '../auth/AuthProvider'
import { useI18n } from '../i18n/I18nProvider'

const navLinkClass =
  'text-gray-400 hover:text-emerald-400 font-medium text-sm transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-emerald-400 after:to-teal-400 after:transition-all hover:after:w-full'

interface NavbarProps {
  mobileOpen: boolean
  onToggleMobile: () => void
  onOpenChat: () => void
}

export default function Navbar({ mobileOpen, onToggleMobile, onOpenChat }: NavbarProps) {
  const { t } = useI18n()
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    onToggleMobile()
  }

  const authLinks = (
    <>
      <Link to="/dashboard" className={navLinkClass}>{t('nav.dashboard')}</Link>
      <Link to="/miners" className={navLinkClass}>{t('nav.miners')}</Link>
      <Link to="/exchange" className={navLinkClass}>{t('nav.exchange')}</Link>
      <Link to="/c2c" className={navLinkClass}>{t('nav.c2c')}</Link>
      <Link to="/withdraw" className={navLinkClass}>{t('nav.withdraw')}</Link>
    </>
  )

  const publicLinks = (
    <>
      <Link to="/" className={navLinkClass}>{t('nav.home')}</Link>
      <Link to="/whitepaper" className={navLinkClass}>{t('nav.whitepaper')}</Link>
      <Link to="/help" className={navLinkClass}>{t('nav.help')}</Link>
    </>
  )

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#141c2a]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
              H
            </div>
            <span className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">
              HEC Mining
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {isAuthenticated ? authLinks : publicLinks}
            <button
              type="button"
              onClick={onOpenChat}
              className="text-gray-400 hover:text-emerald-400 font-medium text-sm transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {t('nav.onlineChat')}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <button type="button" className="text-sm font-medium px-4 py-2 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all">
                  {t('nav.connectWallet')}
                </button>
                <div className="relative group">
                  <button type="button" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-colors">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                      {user?.username?.slice(0, 1).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-gray-300 max-w-[80px] truncate">{user?.username}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-[#1a2538] border border-white/[0.08] shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link to="/dashboard" className="block px-4 py-2.5 text-sm text-gray-400 hover:bg-white/[0.05] hover:text-white">{t('nav.profile')}</Link>
                    <button type="button" onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-white/[0.05] hover:text-red-400">{t('nav.logout')}</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg border border-gray-700 hover:border-emerald-500/50 transition-all">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="text-sm font-medium px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          <button type="button" className="md:hidden p-2 text-gray-400 hover:text-white" onClick={onToggleMobile} aria-label="menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="py-4 border-t border-gray-800">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="block text-gray-400 hover:text-emerald-400 hover:bg-white/5 font-medium px-4 py-3 rounded-lg transition-all" onClick={onToggleMobile}>{t('nav.dashboard')}</Link>
                <Link to="/miners" className="block text-gray-400 hover:text-emerald-400 hover:bg-white/5 font-medium px-4 py-3 rounded-lg transition-all" onClick={onToggleMobile}>{t('nav.miners')}</Link>
                <Link to="/exchange" className="block text-gray-400 hover:text-emerald-400 hover:bg-white/5 font-medium px-4 py-3 rounded-lg transition-all" onClick={onToggleMobile}>{t('nav.exchange')}</Link>
                <Link to="/c2c" className="block text-gray-400 hover:text-emerald-400 hover:bg-white/5 font-medium px-4 py-3 rounded-lg transition-all" onClick={onToggleMobile}>{t('nav.c2c')}</Link>
                <Link to="/withdraw" className="block text-gray-400 hover:text-emerald-400 hover:bg-white/5 font-medium px-4 py-3 rounded-lg transition-all" onClick={onToggleMobile}>{t('nav.withdraw')}</Link>
              </>
            ) : (
              <>
                <Link to="/" className="block text-gray-400 hover:text-emerald-400 hover:bg-white/5 font-medium px-4 py-3 rounded-lg transition-all" onClick={onToggleMobile}>{t('nav.home')}</Link>
                <Link to="/whitepaper" className="block text-gray-400 hover:text-emerald-400 hover:bg-white/5 font-medium px-4 py-3 rounded-lg transition-all" onClick={onToggleMobile}>{t('nav.whitepaper')}</Link>
                <Link to="/help" className="block text-gray-400 hover:text-emerald-400 hover:bg-white/5 font-medium px-4 py-3 rounded-lg transition-all" onClick={onToggleMobile}>{t('nav.help')}</Link>
              </>
            )}
            <button type="button" onClick={() => { onOpenChat(); onToggleMobile() }} className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 hover:bg-white/5 font-medium px-4 py-3 rounded-lg transition-all w-full">
              {t('nav.onlineChat')}
            </button>
            <div className="flex items-center justify-between mt-4 px-4">
              <LanguageSwitcher onSelect={onToggleMobile} />
              {isAuthenticated ? (
                <button type="button" onClick={handleLogout} className="text-sm text-red-400 px-4 py-2">{t('nav.logout')}</button>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="text-center text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300" onClick={onToggleMobile}>{t('nav.login')}</Link>
                  <Link to="/register" className="text-center text-sm font-medium px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white" onClick={onToggleMobile}>{t('nav.register')}</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
